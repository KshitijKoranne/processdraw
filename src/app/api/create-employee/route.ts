import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { ApiError, getAuthUser, handleError, logAction, newId } from "@/lib/server/helpers";

export const dynamic = "force-dynamic";

const VALID_ROLES = ["it_admin", "user", "approver", "viewer"];

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getAuthUser();
    if (currentUser.role !== "it_admin") throw new ApiError("Only IT Admins can create employees", 403);
    if (currentUser.isDemo) throw new ApiError("Demo admins cannot create employees", 403);

    const body = await req.json();
    const employeeCode = String(body.employeeCode || "").trim();
    const fullName = String(body.fullName || "").trim();
    const password = String(body.password || "");
    const role = body.role || "user";
    const isDemo = !!body.isDemo;

    if (!employeeCode || !password || !fullName) {
      throw new ApiError("Employee code, password, and full name are required");
    }
    if (password.length < 8) throw new ApiError("Password must be at least 8 characters");
    if (!VALID_ROLES.includes(role)) throw new ApiError("Invalid role");

    const client = await clerkClient();
    const newUser = await client.users.createUser({
      username: employeeCode,
      password,
      firstName: fullName.split(" ")[0],
      lastName: fullName.split(" ").slice(1).join(" ") || "",
    });

    try {
      const db = getDb();
      const existing = await db.select().from(schema.users).where(eq(schema.users.clerkId, newUser.id)).limit(1);
      if (!existing[0]) {
        await db.insert(schema.users).values({
          id: newId(),
          clerkId: newUser.id,
          email: employeeCode,
          name: fullName,
          role,
          isDemo,
          disabled: false,
          createdAt: Date.now(),
        });
      }
      await logAction({
        action: "employee_created",
        actorId: currentUser.clerkId,
        actorName: currentUser.name,
        actorEmail: currentUser.email,
        targetType: "user",
        targetId: newUser.id,
        targetName: fullName,
        details: JSON.stringify({ role, employeeCode, isDemo }),
      });
    } catch (dbErr: any) {
      // Roll back the Clerk account so we never leave a half-provisioned user.
      console.error("DB registration failed:", dbErr);
      try {
        await client.users.deleteUser(newUser.id);
      } catch (rollbackErr) {
        console.error("Failed to roll back Clerk user:", rollbackErr);
      }
      throw new ApiError("Failed to register employee record", 500);
    }

    return NextResponse.json({
      success: true,
      userId: newUser.id,
      username: employeeCode,
      message: `Employee ${employeeCode} (${fullName}) created as ${role}`,
    });
  } catch (error: any) {
    if (error?.errors) {
      const clerkError = error.errors[0];
      if (clerkError?.code === "form_identifier_exists" || clerkError?.code === "form_username_exists") {
        return NextResponse.json({ error: "That employee code is already in use" }, { status: 409 });
      }
      return NextResponse.json(
        { error: clerkError?.longMessage || clerkError?.message || "Failed to create employee" },
        { status: 400 }
      );
    }
    return handleError(error);
  }
}

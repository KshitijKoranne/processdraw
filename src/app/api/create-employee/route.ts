import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { normalizeLogin } from "@/auth";
import { ApiError, getAuthUser, handleError, logAction, newId } from "@/lib/server/helpers";

export const dynamic = "force-dynamic";

const VALID_ROLES = ["it_admin", "user", "approver", "viewer"];

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getAuthUser();
    if (currentUser.role !== "it_admin") throw new ApiError("Only IT Admins can create employees", 403);
    if (currentUser.isDemo) throw new ApiError("Demo admins cannot create employees", 403);

    const body = await req.json();
    const employeeCode = normalizeLogin(String(body.employeeCode || ""));
    const fullName = String(body.fullName || "").trim();
    const password = String(body.password || "");
    const role = body.role || "user";
    const isDemo = !!body.isDemo;

    if (!employeeCode || !password || !fullName) {
      throw new ApiError("Employee code, password, and full name are required");
    }
    if (password.length < 8) throw new ApiError("Password must be at least 8 characters");
    if (!VALID_ROLES.includes(role)) throw new ApiError("Invalid role");

    const db = getDb();
    const existing = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, employeeCode)).limit(1);
    if (existing[0]) return NextResponse.json({ error: "That employee code is already in use" }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 12);
    const id = newId();
    try {
      await db.insert(schema.users).values({
        id,
        email: employeeCode,
        name: fullName,
        role,
        passwordHash,
        mustChangePassword: true,
        isDemo,
        disabled: false,
        createdAt: Date.now(),
      });
    } catch {
      // Unique index race — someone created the same code concurrently.
      return NextResponse.json({ error: "That employee code is already in use" }, { status: 409 });
    }

    await logAction({
      action: "employee_created",
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorEmail: currentUser.email,
      targetType: "user",
      targetId: id,
      targetName: fullName,
      details: JSON.stringify({ role, employeeCode, isDemo }),
    });

    return NextResponse.json({
      success: true,
      userId: id,
      username: employeeCode,
      message: `Employee ${employeeCode} (${fullName}) created as ${role}`,
    });
  } catch (error) {
    return handleError(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { clerkClient, auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";
const VALID_ROLES = ["it_admin", "user", "approver", "viewer"];

export async function POST(req: NextRequest) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (!CONVEX_URL) {
      return NextResponse.json({ error: "Server is not configured (missing Convex URL)" }, { status: 500 });
    }

    // Act on Convex as the calling user so role checks happen server-side.
    const token = await getToken({ template: "convex" });
    if (!token) {
      return NextResponse.json({ error: "Could not verify your session" }, { status: 401 });
    }
    const convex = new ConvexHttpClient(CONVEX_URL);
    convex.setAuth(token);

    const currentUser = await convex.query(api.users.getCurrentUser, {});
    if (!currentUser || currentUser.role !== "it_admin" || currentUser.disabled) {
      return NextResponse.json({ error: "Only IT Admins can create employees" }, { status: 403 });
    }
    if (currentUser.isDemo) {
      return NextResponse.json({ error: "Demo admins cannot create employees" }, { status: 403 });
    }

    const body = await req.json();
    const employeeCode = String(body.employeeCode || "").trim();
    const fullName = String(body.fullName || "").trim();
    const password = String(body.password || "");
    const role = body.role || "user";

    if (!employeeCode || !password || !fullName) {
      return NextResponse.json(
        { error: "Employee code, password, and full name are required" },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const client = await clerkClient();
    const newUser = await client.users.createUser({
      username: employeeCode,
      password: password,
      firstName: fullName.split(" ")[0],
      lastName: fullName.split(" ").slice(1).join(" ") || "",
    });

    try {
      await convex.mutation(api.users.preRegister, {
        clerkId: newUser.id,
        name: fullName,
        employeeCode,
        role,
      });
    } catch (convexErr: any) {
      // Roll back the Clerk account so we never leave a half-provisioned user.
      console.error("Convex pre-register failed:", convexErr);
      try {
        await client.users.deleteUser(newUser.id);
      } catch (rollbackErr) {
        console.error("Failed to roll back Clerk user:", rollbackErr);
      }
      return NextResponse.json(
        { error: convexErr?.message || "Failed to register employee record" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      userId: newUser.id,
      username: employeeCode,
      message: `Employee ${employeeCode} (${fullName}) created as ${role}`,
    });
  } catch (error: any) {
    console.error("Create employee error:", error);

    if (error?.errors) {
      const clerkError = error.errors[0];
      if (clerkError?.code === "form_identifier_exists" || clerkError?.code === "form_username_exists") {
        return NextResponse.json(
          { error: "That employee code is already in use" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: clerkError?.longMessage || clerkError?.message || "Failed to create employee" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

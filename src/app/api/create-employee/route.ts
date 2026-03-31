import { NextRequest, NextResponse } from "next/server";
import { clerkClient, auth } from "@clerk/nextjs/server";

// We'll call Convex HTTP API directly instead of using the client SDK
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";

export async function POST(req: NextRequest) {
  try {
    // Verify the requester is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { employeeCode, password, fullName, role } = body;

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

    const validRoles = ["it_admin", "user", "approver", "viewer"];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Create the user in Clerk
    const client = await clerkClient();
    const newUser = await client.users.createUser({
      username: employeeCode,
      password: password,
      firstName: fullName.split(" ")[0],
      lastName: fullName.split(" ").slice(1).join(" ") || "",
    });

    // Pre-register in Convex with correct name and role
    try {
      await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "users:preRegister",
          args: {
            clerkId: newUser.id,
            name: fullName,
            employeeCode: employeeCode,
            role: role || "user",
          },
        }),
      });
    } catch (convexErr) {
      console.error("Convex pre-register failed:", convexErr);
    }

    return NextResponse.json({
      success: true,
      userId: newUser.id,
      username: employeeCode,
      message: `Employee ${employeeCode} (${fullName}) created as ${role || "user"}`,
    });
  } catch (error: any) {
    console.error("Create employee error:", error);

    // Handle Clerk-specific errors
    if (error?.errors) {
      const clerkError = error.errors[0];
      if (clerkError?.code === "form_identifier_exists") {
        return NextResponse.json(
          { error: `Employee code "${error.errors[0]?.meta?.paramName || ""}" already exists` },
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

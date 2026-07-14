import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { normalizeLogin } from "@/auth";
import { ApiError, handleError, logAction, newId } from "@/lib/server/helpers";

export const dynamic = "force-dynamic";

async function userCount() {
  const db = getDb();
  const rows = await db.select({ count: sql<number>`count(*)::int` }).from(schema.users);
  return rows[0]?.count ?? 0;
}

/** Tells the sign-in page whether first-run setup is needed. */
export async function GET() {
  try {
    return NextResponse.json({ needsSetup: (await userCount()) === 0 });
  } catch (error) {
    return handleError(error);
  }
}

/** Creates the very first account as IT Admin. Only works while the users table is empty. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const employeeCode = normalizeLogin(String(body.employeeCode || ""));
    const fullName = String(body.fullName || "").trim();
    const password = String(body.password || "");

    if (!employeeCode || !fullName || !password) throw new ApiError("Employee code, name, and password are required");
    if (password.length < 8) throw new ApiError("Password must be at least 8 characters");
    if ((await userCount()) > 0) throw new ApiError("Setup has already been completed", 403);

    const db = getDb();
    const passwordHash = await bcrypt.hash(password, 12);
    const id = newId();
    await db.insert(schema.users).values({
      id,
      email: employeeCode,
      name: fullName,
      role: "it_admin",
      passwordHash,
      mustChangePassword: false,
      disabled: false,
      isDemo: false,
      createdAt: Date.now(),
    });

    await logAction({
      action: "user_created",
      actorId: id,
      actorName: fullName,
      actorEmail: employeeCode,
      targetType: "user",
      targetId: id,
      targetName: fullName,
      details: JSON.stringify({ role: "it_admin", isFirstUser: true }),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}

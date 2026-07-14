import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { ApiError, getAuthUser, handleError, logAction } from "@/lib/server/helpers";

export const dynamic = "force-dynamic";

/** Self-service password change: { currentPassword, newPassword }. */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    const body = await req.json();
    const currentPassword = String(body.currentPassword || "");
    const newPassword = String(body.newPassword || "");

    if (!currentPassword || !newPassword) throw new ApiError("Current and new password are required");
    if (newPassword.length < 8) throw new ApiError("New password must be at least 8 characters");
    if (newPassword === currentPassword) throw new ApiError("New password must be different from the current one");

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new ApiError("Current password is incorrect", 403);

    const db = getDb();
    await db.update(schema.users).set({
      passwordHash: await bcrypt.hash(newPassword, 12),
      mustChangePassword: false,
    }).where(eq(schema.users.id, user.id));

    await logAction({
      action: "password_changed",
      actorId: user.id,
      actorName: user.name,
      actorEmail: user.email,
      targetType: "user",
      targetId: user.id,
      targetName: user.name,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}

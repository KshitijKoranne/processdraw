import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { ApiError, getAuthUser, handleError, logAction } from "@/lib/server/helpers";

export const dynamic = "force-dynamic";

const VALID_ROLES = ["it_admin", "user", "approver", "viewer"];

/** Admin updates to a user: { role } and/or { disabled }. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const currentUser = await getAuthUser();
    if (currentUser.role !== "it_admin") throw new ApiError("Only active IT Admins can manage users", 403);
    if (currentUser.isDemo) throw new ApiError("Demo admins cannot manage users", 403);

    const db = getDb();
    const targetRows = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    const target = targetRows[0];
    if (!target) throw new ApiError("User not found", 404);
    if (target.isDemo) throw new ApiError("Demo users are managed by demo reset only", 403);

    const body = await req.json();

    if (body.role !== undefined) {
      if (!VALID_ROLES.includes(body.role)) throw new ApiError("Invalid role");
      const oldRole = target.role;
      await db.update(schema.users).set({ role: body.role }).where(eq(schema.users.id, id));
      await logAction({
        action: "role_changed",
        actorId: currentUser.clerkId,
        actorName: currentUser.name,
        actorEmail: currentUser.email,
        targetType: "user",
        targetId: target.clerkId,
        targetName: target.name,
        details: JSON.stringify({ oldRole, newRole: body.role }),
      });
    }

    if (body.disabled !== undefined) {
      if (target.clerkId === currentUser.clerkId) throw new ApiError("Cannot disable yourself");
      await db.update(schema.users).set({ disabled: !!body.disabled }).where(eq(schema.users.id, id));
      await logAction({
        action: body.disabled ? "user_disabled" : "user_enabled",
        actorId: currentUser.clerkId,
        actorName: currentUser.name,
        actorEmail: currentUser.email,
        targetType: "user",
        targetId: target.clerkId,
        targetName: target.name,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}

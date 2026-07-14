import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getAuthUser, handleError } from "@/lib/server/helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getAuthUser();
    const db = getDb();
    const [notifications, unread] = await Promise.all([
      db.select().from(schema.notifications)
        .where(eq(schema.notifications.userId, user.id))
        .orderBy(desc(schema.notifications.createdAt))
        .limit(50),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.notifications)
        .where(and(eq(schema.notifications.userId, user.id), eq(schema.notifications.read, false))),
    ]);
    return NextResponse.json({ notifications, unreadCount: unread[0]?.count ?? 0 });
  } catch (error) {
    return handleError(error);
  }
}

/** Mark one notification (body: { id }) or all (body: {}) as read. */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    const body = await req.json().catch(() => ({}));
    const db = getDb();
    if (body.id) {
      await db.update(schema.notifications).set({ read: true })
        .where(and(eq(schema.notifications.id, String(body.id)), eq(schema.notifications.userId, user.id)));
    } else {
      await db.update(schema.notifications).set({ read: true })
        .where(and(eq(schema.notifications.userId, user.id), eq(schema.notifications.read, false)));
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}

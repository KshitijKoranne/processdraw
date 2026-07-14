import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { ApiError, getAuthUser, handleError } from "@/lib/server/helpers";
import type { DbUser } from "@/db/schema";

export const dynamic = "force-dynamic";

function parseDetails(raw?: string | null) {
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

function sameDemoScope(user: DbUser, log: { actorId: string; details: string | null }) {
  const details = parseDetails(log.details);
  if (details.isDemo !== undefined) return !!details.isDemo === user.isDemo;
  if (user.isDemo) return log.actorId === user.id;
  return true;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (user.role !== "it_admin") throw new ApiError("Only IT Admins can view the audit log", 403);
    const limit = Math.min(500, Number(req.nextUrl.searchParams.get("limit")) || 100);
    const db = getDb();
    const rows = await db.select().from(schema.auditLog)
      .orderBy(desc(schema.auditLog.timestamp))
      .limit(limit * 2);
    return NextResponse.json(rows.filter((log) => sameDemoScope(user, log)).slice(0, limit));
  } catch (error) {
    return handleError(error);
  }
}

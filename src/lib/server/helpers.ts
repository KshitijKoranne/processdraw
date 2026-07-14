import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { DbDiagram, DbUser } from "@/db/schema";

export const newId = () => crypto.randomUUID();

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function handleError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error("API error:", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

/** Load the signed-in user's DB row; throws ApiError if unauthenticated, unknown, or disabled. */
export async function getAuthUser({ allowDisabled = false } = {}): Promise<DbUser> {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) throw new ApiError("Not authenticated", 401);
  const db = getDb();
  const rows = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  const user = rows[0];
  if (!user) throw new ApiError("User not found", 404);
  if (user.disabled && !allowDisabled) throw new ApiError("Your account has been disabled. Contact your administrator.", 403);
  return user;
}

export function requiredRemarks(value: unknown, label: string) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) throw new ApiError(`${label} remarks are required`);
  return text;
}

/** Same visibility rules as the original Convex backend. */
export function canAccessDiagram(user: DbUser, diagram: DbDiagram) {
  if (user.isDemo !== diagram.isDemo) return false;
  if (user.role === "it_admin") return true;
  if (user.role === "user") return diagram.ownerId === user.id;
  if (user.role === "approver") return ["submitted", "approved", "rejected"].includes(diagram.status);
  if (user.role === "viewer") return diagram.status === "approved";
  return false;
}

export async function getDiagramOrThrow(diagramId: string) {
  const db = getDb();
  const rows = await db.select().from(schema.diagrams).where(eq(schema.diagrams.id, diagramId)).limit(1);
  if (!rows[0]) throw new ApiError("Diagram not found", 404);
  return rows[0];
}

export function assertSameDemoScope(user: DbUser, diagram: DbDiagram) {
  if (diagram.isDemo !== user.isDemo) throw new ApiError("Demo and real data are isolated", 403);
}

export async function logAction(data: {
  action: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  details?: string;
}) {
  const db = getDb();
  await db.insert(schema.auditLog).values({ id: newId(), ...data, timestamp: Date.now() });
}

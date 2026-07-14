import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { ApiError, getAuthUser, handleError, logAction, newId } from "@/lib/server/helpers";

export const dynamic = "force-dynamic";

/** List diagrams visible to the caller (same rules as the old Convex listAll). */
export async function GET() {
  try {
    const user = await getAuthUser();
    const db = getDb();
    const demoScope = eq(schema.diagrams.isDemo, user.isDemo);

    let where;
    if (user.role === "it_admin") where = demoScope;
    else if (user.role === "user") where = and(demoScope, eq(schema.diagrams.ownerId, user.id));
    else if (user.role === "approver") where = and(demoScope, inArray(schema.diagrams.status, ["submitted", "approved", "rejected"]));
    else if (user.role === "viewer") where = and(demoScope, eq(schema.diagrams.status, "approved"));
    else return NextResponse.json([]);

    const rows = await db.select().from(schema.diagrams).where(where).orderBy(desc(schema.diagrams.createdAt));
    return NextResponse.json(rows);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (user.role !== "user") throw new ApiError("Only users can create diagrams", 403);
    const body = await req.json();
    const name = String(body.name || "").trim() || "Untitled diagram";
    const db = getDb();
    const now = Date.now();

    const inserted = await db.insert(schema.diagrams).values({
      id: newId(),
      name,
      ownerId: user.id,
      ownerName: user.name,
      blocks: Array.isArray(body.blocks) ? body.blocks : [],
      arrowAnnotations: body.arrowAnnotations && typeof body.arrowAnnotations === "object" ? body.arrowAnnotations : {},
      settings: { ...(body.settings || {}), finalized: false },
      status: "draft",
      finalized: false,
      isDemo: user.isDemo,
      createdAt: now,
      updatedAt: now,
    }).returning({ id: schema.diagrams.id });

    await logAction({
      action: "diagram_created",
      actorId: user.id,
      actorName: user.name,
      actorEmail: user.email,
      targetType: "diagram",
      targetId: inserted[0].id,
      targetName: name,
      details: JSON.stringify({ isDemo: user.isDemo }),
    });

    return NextResponse.json({ id: inserted[0].id });
  } catch (error) {
    return handleError(error);
  }
}

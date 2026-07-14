import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { ApiError, assertSameDemoScope, getAuthUser, getDiagramOrThrow, handleError, logAction, newId, requiredRemarks } from "@/lib/server/helpers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const remarks = requiredRemarks(body.remarks, "Revert");
    const user = await getAuthUser();
    if (user.role !== "approver") throw new ApiError("Only approvers can revert diagrams", 403);
    const diagram = await getDiagramOrThrow(id);
    assertSameDemoScope(user, diagram);
    if (diagram.status !== "submitted") throw new ApiError("Only submitted diagrams can be reverted");

    const db = getDb();
    const now = Date.now();

    const versions = await db.select().from(schema.diagramVersions)
      .where(eq(schema.diagramVersions.diagramId, id))
      .orderBy(desc(schema.diagramVersions.revisionNumber))
      .limit(1);
    const version = versions[0];
    if (version) {
      await db.update(schema.diagramVersions).set({
        statusAtSnapshot: "reverted",
        snapshotType: "reverted_snapshot",
        revertedBy: user.id,
        revertedByName: user.name,
        revertedAt: now,
        revertRemarks: remarks,
      }).where(eq(schema.diagramVersions.id, version.id));
    }

    await db.update(schema.diagrams).set({
      status: "draft",
      settings: { ...(diagram.settings || {}), finalized: false },
      finalized: false,
      finalizedBy: null,
      finalizedByName: null,
      finalizedAt: null,
      revertedBy: user.id,
      revertedByName: user.name,
      revertComment: remarks,
      revertedAt: now,
      updatedAt: now,
    }).where(eq(schema.diagrams.id, id));

    await db.insert(schema.notifications).values({
      id: newId(),
      userId: diagram.ownerId,
      type: "reverted",
      diagramId: id,
      diagramName: diagram.name,
      actorName: user.name,
      comment: remarks,
      read: false,
      createdAt: now,
    });

    await logAction({
      action: "diagram_reverted",
      actorId: user.id,
      actorName: user.name,
      actorEmail: user.email,
      targetType: "diagram",
      targetId: id,
      targetName: diagram.name,
      details: JSON.stringify({ revisionNumber: version?.revisionNumber ?? null, remarks, finalizedReset: true }),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}

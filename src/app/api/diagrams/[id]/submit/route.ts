import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { ApiError, assertSameDemoScope, getAuthUser, getDiagramOrThrow, handleError, logAction, newId, requiredRemarks } from "@/lib/server/helpers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const remarks = requiredRemarks(body.remarks, "Submission");
    const user = await getAuthUser();
    if (user.role !== "user") throw new ApiError("Only users can submit diagrams", 403);
    const diagram = await getDiagramOrThrow(id);
    assertSameDemoScope(user, diagram);
    if (diagram.ownerId !== user.clerkId) throw new ApiError("Can only submit your own diagrams", 403);
    if (diagram.status !== "draft") throw new ApiError("Only draft diagrams can be submitted");
    if (!Array.isArray(diagram.blocks) || diagram.blocks.length === 0) throw new ApiError("Add at least one process step before submitting");

    const db = getDb();
    const now = Date.now();

    const latest = await db.select({ revisionNumber: schema.diagramVersions.revisionNumber })
      .from(schema.diagramVersions)
      .where(eq(schema.diagramVersions.diagramId, id))
      .orderBy(desc(schema.diagramVersions.revisionNumber))
      .limit(1);
    const revisionNumber = latest.length ? latest[0].revisionNumber + 1 : 0;

    const finalizedSettings = { ...(diagram.settings || {}), finalized: true };

    await db.insert(schema.diagramVersions).values({
      id: newId(),
      diagramId: id,
      revisionNumber,
      name: diagram.name,
      blocks: diagram.blocks,
      arrowAnnotations: diagram.arrowAnnotations,
      settings: finalizedSettings,
      statusAtSnapshot: "submitted",
      snapshotType: "submitted_snapshot",
      submittedBy: user.clerkId,
      submittedByName: user.name,
      submittedAt: now,
      submittedRemarks: remarks,
      createdAt: now,
    });

    await db.update(schema.diagrams).set({
      status: "submitted",
      settings: finalizedSettings,
      finalized: true,
      finalizedBy: user.clerkId,
      finalizedByName: user.name,
      finalizedAt: now,
      currentRevision: revisionNumber,
      updatedAt: now,
    }).where(eq(schema.diagrams.id, id));

    // Notify all active approvers in the same demo scope.
    const approvers = await db.select().from(schema.users).where(and(
      eq(schema.users.role, "approver"),
      eq(schema.users.isDemo, user.isDemo),
      eq(schema.users.disabled, false),
    ));
    if (approvers.length) {
      await db.insert(schema.notifications).values(approvers.map((approver) => ({
        id: newId(),
        userId: approver.clerkId,
        type: "submitted",
        diagramId: id,
        diagramName: diagram.name,
        actorName: user.name,
        comment: remarks,
        read: false,
        createdAt: now,
      })));
    }

    await logAction({
      action: "diagram_submitted",
      actorId: user.clerkId,
      actorName: user.name,
      actorEmail: user.email,
      targetType: "diagram",
      targetId: id,
      targetName: diagram.name,
      details: JSON.stringify({ revisionNumber, remarks, finalizedByServer: true }),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}

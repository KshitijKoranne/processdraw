import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { ApiError, assertSameDemoScope, getAuthUser, getDiagramOrThrow, handleError, logAction, newId, requiredRemarks } from "@/lib/server/helpers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const remarks = requiredRemarks(body.remarks, "Review");
    const decision = body.decision;
    const user = await getAuthUser();
    if (user.role !== "approver") throw new ApiError("Only approvers can review diagrams", 403);
    if (!["approved", "rejected"].includes(decision)) throw new ApiError("Invalid decision");
    const diagram = await getDiagramOrThrow(id);
    assertSameDemoScope(user, diagram);
    if (diagram.status !== "submitted") throw new ApiError("Only submitted diagrams can be reviewed");
    if (!diagram.finalized) throw new ApiError("Cannot review a diagram that was not finalized by the server");

    const db = getDb();
    const now = Date.now();

    const versions = await db.select().from(schema.diagramVersions)
      .where(eq(schema.diagramVersions.diagramId, id))
      .orderBy(desc(schema.diagramVersions.revisionNumber))
      .limit(1);
    const version = versions[0];
    if (!version) throw new ApiError("No submitted snapshot found for review");

    if (decision === "approved") {
      await db.update(schema.diagramVersions).set({
        statusAtSnapshot: "approved",
        snapshotType: "approved_snapshot",
        approvedBy: user.id,
        approvedByName: user.name,
        approvedAt: now,
        approvalRemarks: remarks,
      }).where(eq(schema.diagramVersions.id, version.id));
      await db.update(schema.diagrams).set({
        status: "approved",
        approvedBy: user.id,
        approvedByName: user.name,
        approvedAt: now,
        updatedAt: now,
      }).where(eq(schema.diagrams.id, id));
    } else {
      await db.update(schema.diagramVersions).set({
        statusAtSnapshot: "rejected",
        snapshotType: "rejected_snapshot",
        rejectedBy: user.id,
        rejectedByName: user.name,
        rejectedAt: now,
        rejectionRemarks: remarks,
      }).where(eq(schema.diagramVersions.id, version.id));
      await db.update(schema.diagrams).set({
        status: "rejected",
        rejectedBy: user.id,
        rejectedByName: user.name,
        rejectionComment: remarks,
        rejectedAt: now,
        updatedAt: now,
      }).where(eq(schema.diagrams.id, id));
    }

    await db.insert(schema.notifications).values({
      id: newId(),
      userId: diagram.ownerId,
      type: decision,
      diagramId: id,
      diagramName: diagram.name,
      actorName: user.name,
      comment: remarks,
      read: false,
      createdAt: now,
    });

    await logAction({
      action: decision === "approved" ? "diagram_approved" : "diagram_rejected",
      actorId: user.id,
      actorName: user.name,
      actorEmail: user.email,
      targetType: "diagram",
      targetId: id,
      targetName: diagram.name,
      details: JSON.stringify({ previousStatus: diagram.status, revisionNumber: version.revisionNumber, remarks }),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}

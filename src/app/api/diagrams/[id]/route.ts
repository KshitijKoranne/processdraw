import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { ApiError, assertSameDemoScope, getAuthUser, getDiagramOrThrow, handleError, logAction } from "@/lib/server/helpers";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (user.role !== "user") throw new ApiError("Only users can edit diagrams", 403);
    const diagram = await getDiagramOrThrow(id);
    assertSameDemoScope(user, diagram);
    if (diagram.ownerId !== user.id) throw new ApiError("Can only edit your own diagrams", 403);
    if (diagram.status !== "draft") throw new ApiError("Only draft diagrams can be edited");

    const body = await req.json();
    const updates: Record<string, any> = {
      updatedAt: Date.now(),
      finalized: false,
      finalizedBy: null,
      finalizedByName: null,
      finalizedAt: null,
    };
    if (body.name !== undefined) updates.name = String(body.name);
    if (body.blocks !== undefined) updates.blocks = Array.isArray(body.blocks) ? body.blocks : [];
    if (body.arrowAnnotations !== undefined) updates.arrowAnnotations = body.arrowAnnotations || {};
    if (body.settings !== undefined) updates.settings = { ...(body.settings || {}), finalized: false };

    const db = getDb();
    await db.update(schema.diagrams).set(updates).where(eq(schema.diagrams.id, id));

    await logAction({
      action: "diagram_updated",
      actorId: user.id,
      actorName: user.name,
      actorEmail: user.email,
      targetType: "diagram",
      targetId: id,
      targetName: (body.name as string) || diagram.name,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (user.role !== "user") throw new ApiError("Only users can delete diagrams", 403);
    const diagram = await getDiagramOrThrow(id);
    assertSameDemoScope(user, diagram);
    if (diagram.ownerId !== user.id) throw new ApiError("Can only delete your own diagrams", 403);
    if (diagram.status !== "draft") throw new ApiError("Only draft diagrams can be deleted");

    const db = getDb();
    await db.delete(schema.diagrams).where(eq(schema.diagrams.id, id));

    await logAction({
      action: "diagram_deleted",
      actorId: user.id,
      actorName: user.name,
      actorEmail: user.email,
      targetType: "diagram",
      targetId: id,
      targetName: diagram.name,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { canAccessDiagram, getAuthUser, getDiagramOrThrow, handleError } from "@/lib/server/helpers";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    const diagram = await getDiagramOrThrow(id);
    if (!canAccessDiagram(user, diagram)) return NextResponse.json([]);
    const db = getDb();
    const rows = await db.select().from(schema.diagramVersions)
      .where(eq(schema.diagramVersions.diagramId, id))
      .orderBy(desc(schema.diagramVersions.revisionNumber));
    return NextResponse.json(rows);
  } catch (error) {
    return handleError(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { newId } from "@/lib/server/helpers";

export const dynamic = "force-dynamic";

const SAMPLE_DRAFT_BLOCKS = [
  { id: "n1", text: "Charge Isobutylbenzene to Reactor R-101", leftItems: [{ id: "s1a", text: "Isobutylbenzene (200 kg)", type: "label", arrowDir: "right" }], rightItems: [{ id: "s1b", text: "Reactor R-101", type: "equipment", arrowDir: "left" }] },
  { id: "n2", text: "Add Acetic Anhydride under stirring", leftItems: [{ id: "s2a", text: "Acetic Anhydride (150 kg)", type: "label", arrowDir: "right" }], rightItems: [{ id: "s2b", text: "IPQC: Check temp ≤ 45°C", type: "ipqc", arrowDir: "left" }] },
  { id: "n3", text: "Heat to 85°C and maintain for 4 hours", leftItems: [], rightItems: [{ id: "s3a", text: "IPQC: Check reaction completion by TLC", type: "ipqc", arrowDir: "left" }] },
  { id: "n4", text: "Cool to 25°C and filter", leftItems: [{ id: "s4a", text: "Mother Liquor", type: "label", arrowDir: "left" }], rightItems: [{ id: "s4b", text: "Filter Press FP-201", type: "equipment", arrowDir: "left" }] },
  { id: "n5", text: "Wash with Purified Water (3x)", leftItems: [{ id: "s5a", text: "Purified Water (300 L)", type: "label", arrowDir: "right" }], rightItems: [] },
  { id: "n6", text: "Dry in Tray Dryer at 60°C for 12 hours", leftItems: [], rightItems: [{ id: "s6a", text: "Tray Dryer TD-301", type: "equipment", arrowDir: "left" }, { id: "s6b", text: "IPQC: Check LOD ≤ 0.5%", type: "ipqc", arrowDir: "left" }] },
];

const SAMPLE_APPROVED_BLOCKS = [
  { id: "n1", text: "Sift Paracetamol through 40# mesh", leftItems: [{ id: "p1a", text: "Paracetamol IP (500 kg)", type: "label", arrowDir: "right" }], rightItems: [{ id: "p1b", text: "Sifter S-101", type: "equipment", arrowDir: "left" }] },
  { id: "n2", text: "Load into RMG and dry mix for 10 min", leftItems: [{ id: "p2a", text: "Starch (25 kg)", type: "label", arrowDir: "right" }], rightItems: [{ id: "p2b", text: "RMG-201", type: "equipment", arrowDir: "left" }] },
  { id: "n3", text: "Add binder solution and granulate", leftItems: [{ id: "p3a", text: "PVP K30 Solution (40 L)", type: "label", arrowDir: "right" }], rightItems: [{ id: "p3b", text: "IPQC: Check granule size", type: "ipqc", arrowDir: "left" }] },
  { id: "n4", text: "Dry in FBD at 55°C until LOD ≤ 2%", leftItems: [], rightItems: [{ id: "p4a", text: "FBD-301", type: "equipment", arrowDir: "left" }, { id: "p4b", text: "IPQC: LOD Check", type: "ipqc", arrowDir: "left" }] },
];

const SAMPLE_SUBMITTED_BLOCKS = [
  { id: "n1", text: "Load coated tablets into coating pan", leftItems: [], rightItems: [{ id: "c1a", text: "Coating Pan CP-401", type: "equipment", arrowDir: "left" }] },
  { id: "n2", text: "Prepare HPMC coating solution", leftItems: [{ id: "c2a", text: "HPMC E5 (8 kg)", type: "label", arrowDir: "right" }, { id: "c2b", text: "Purified Water (80 L)", type: "label", arrowDir: "right" }], rightItems: [] },
  { id: "n3", text: "Spray coating at 45°C inlet temp", leftItems: [], rightItems: [{ id: "c3a", text: "IPQC: Weight gain 3±0.5%", type: "ipqc", arrowDir: "left" }] },
  { id: "n4", text: "Cool and unload coated tablets", leftItems: [], rightItems: [{ id: "c4a", text: "IPQC: Appearance check", type: "ipqc", arrowDir: "left" }] },
];

/** Wipes demo-generated data and reseeds sample diagrams. Triggered by Vercel Cron. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const demoUsers = await db.select().from(schema.users).where(eq(schema.users.isDemo, true));
  if (demoUsers.length === 0) return NextResponse.json({ ok: true, skipped: "no demo users" });
  const demoUserIds = demoUsers.map((user) => user.id);

  // Wipe demo diagrams (and their versions), notifications, and audit entries.
  const demoDiagrams = await db.select({ id: schema.diagrams.id }).from(schema.diagrams).where(eq(schema.diagrams.isDemo, true));
  const demoDiagramIds = demoDiagrams.map((diagram) => diagram.id);
  if (demoDiagramIds.length) {
    await db.delete(schema.diagramVersions).where(inArray(schema.diagramVersions.diagramId, demoDiagramIds));
    await db.delete(schema.diagrams).where(inArray(schema.diagrams.id, demoDiagramIds));
  }
  await db.delete(schema.notifications).where(inArray(schema.notifications.userId, demoUserIds));
  await db.delete(schema.auditLog).where(inArray(schema.auditLog.actorId, demoUserIds));

  const demoUser = demoUsers.find((user) => user.role === "user");
  const demoApprover = demoUsers.find((user) => user.role === "approver");
  if (!demoUser) return NextResponse.json({ ok: true, skipped: "no demo user role" });

  const now = Date.now();

  await db.insert(schema.diagrams).values({
    id: newId(),
    name: "Sample: Ibuprofen Synthesis",
    ownerId: demoUser.id,
    ownerName: demoUser.name,
    blocks: SAMPLE_DRAFT_BLOCKS,
    arrowAnnotations: { 2: { left: [{ id: "a1", text: "Wet Cake" }], right: [] } },
    settings: { finalized: false },
    status: "draft",
    finalized: false,
    isDemo: true,
    createdAt: now,
    updatedAt: now,
  });

  if (demoApprover) {
    const approvedId = newId();
    await db.insert(schema.diagrams).values({
      id: approvedId,
      name: "Sample: Paracetamol Granulation",
      ownerId: demoUser.id,
      ownerName: demoUser.name,
      blocks: SAMPLE_APPROVED_BLOCKS,
      arrowAnnotations: {},
      settings: { finalized: true },
      status: "approved",
      currentRevision: 0,
      finalized: true,
      finalizedBy: demoUser.id,
      finalizedByName: demoUser.name,
      finalizedAt: now - 86000000,
      approvedBy: demoApprover.id,
      approvedByName: demoApprover.name,
      approvedAt: now,
      isDemo: true,
      createdAt: now - 86400000,
      updatedAt: now,
    });
    await db.insert(schema.diagramVersions).values({
      id: newId(),
      diagramId: approvedId,
      revisionNumber: 0,
      name: "Sample: Paracetamol Granulation",
      blocks: SAMPLE_APPROVED_BLOCKS,
      arrowAnnotations: {},
      settings: { finalized: true },
      statusAtSnapshot: "approved",
      snapshotType: "approved_snapshot",
      submittedBy: demoUser.id,
      submittedByName: demoUser.name,
      submittedAt: now - 86000000,
      submittedRemarks: "Demo submitted for approval.",
      approvedBy: demoApprover.id,
      approvedByName: demoApprover.name,
      approvedAt: now,
      approvalRemarks: "Demo approval completed.",
      createdAt: now - 86000000,
    });
  }

  const submittedId = newId();
  await db.insert(schema.diagrams).values({
    id: submittedId,
    name: "Sample: Amoxicillin Coating",
    ownerId: demoUser.id,
    ownerName: demoUser.name,
    blocks: SAMPLE_SUBMITTED_BLOCKS,
    arrowAnnotations: {},
    settings: { finalized: true },
    status: "submitted",
    currentRevision: 0,
    finalized: true,
    finalizedBy: demoUser.id,
    finalizedByName: demoUser.name,
    finalizedAt: now - 3600000,
    isDemo: true,
    createdAt: now - 3600000,
    updatedAt: now,
  });
  await db.insert(schema.diagramVersions).values({
    id: newId(),
    diagramId: submittedId,
    revisionNumber: 0,
    name: "Sample: Amoxicillin Coating",
    blocks: SAMPLE_SUBMITTED_BLOCKS,
    arrowAnnotations: {},
    settings: { finalized: true },
    statusAtSnapshot: "submitted",
    snapshotType: "submitted_snapshot",
    submittedBy: demoUser.id,
    submittedByName: demoUser.name,
    submittedAt: now - 3600000,
    submittedRemarks: "Demo submission awaiting approver review.",
    createdAt: now - 3600000,
  });

  return NextResponse.json({ ok: true });
}

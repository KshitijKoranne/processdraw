import { internalMutation, query } from "./_generated/server";

export const wipeDemoData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    const demoUsers = allUsers.filter((user) => user.isDemo);
    const demoUserIds = demoUsers.map((user) => user.clerkId);
    if (demoUserIds.length === 0) return;

    const allDiagrams = await ctx.db.query("diagrams").collect();
    const demoDiagrams = allDiagrams.filter((diagram) => diagram.isDemo || demoUserIds.includes(diagram.ownerId));
    for (const diagram of demoDiagrams) await ctx.db.delete(diagram._id);

    const allVersions = await ctx.db.query("diagram_versions").collect();
    for (const version of allVersions) {
      const sourceDiagram = demoDiagrams.find((diagram) => String(diagram._id) === String(version.diagramId));
      if (sourceDiagram) await ctx.db.delete(version._id);
    }

    const allNotifications = await ctx.db.query("notifications").collect();
    const demoNotifications = allNotifications.filter((notification) => demoUserIds.includes(notification.userId));
    for (const notification of demoNotifications) await ctx.db.delete(notification._id);

    const allLogs = await ctx.db.query("audit_log").collect();
    const demoLogs = allLogs.filter((log) => demoUserIds.includes(log.actorId));
    for (const log of demoLogs) await ctx.db.delete(log._id);

    const demoUser = demoUsers.find((user) => user.role === "user");
    const demoApprover = demoUsers.find((user) => user.role === "approver");
    if (!demoUser) return;

    await ctx.db.insert("diagrams", {
      name: "Sample: Ibuprofen Synthesis",
      ownerId: demoUser.clerkId,
      ownerName: demoUser.name,
      blocks: JSON.stringify([
        { id: "n1", text: "Charge Isobutylbenzene to Reactor R-101", leftItems: [{ text: "Isobutylbenzene (200 kg)", type: "label", arrowDir: "right" }], rightItems: [{ text: "Reactor R-101", type: "equipment", arrowDir: "left" }] },
        { id: "n2", text: "Add Acetic Anhydride under stirring", leftItems: [{ text: "Acetic Anhydride (150 kg)", type: "label", arrowDir: "right" }], rightItems: [{ text: "IPQC: Check temp ≤ 45°C", type: "ipqc", arrowDir: "left" }] },
        { id: "n3", text: "Heat to 85°C and maintain for 4 hours", leftItems: [], rightItems: [{ text: "IPQC: Check reaction completion by TLC", type: "ipqc", arrowDir: "left" }] },
        { id: "n4", text: "Cool to 25°C and filter", leftItems: [{ text: "Mother Liquor", type: "label", arrowDir: "left" }], rightItems: [{ text: "Filter Press FP-201", type: "equipment", arrowDir: "left" }] },
        { id: "n5", text: "Wash with Purified Water (3x)", leftItems: [{ text: "Purified Water (300 L)", type: "label", arrowDir: "right" }], rightItems: [] },
        { id: "n6", text: "Dry in Tray Dryer at 60°C for 12 hours", leftItems: [], rightItems: [{ text: "Tray Dryer TD-301", type: "equipment", arrowDir: "left" }, { text: "IPQC: Check LOD ≤ 0.5%", type: "ipqc", arrowDir: "left" }] },
      ]),
      arrowAnnotations: JSON.stringify({ 2: { left: [{ text: "Wet Cake" }], right: [] } }),
      settings: JSON.stringify({ finalized: false }),
      status: "draft",
      finalized: false,
      isDemo: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    if (demoApprover) {
      const approvedBlocks = JSON.stringify([
        { id: "n1", text: "Sift Paracetamol through 40# mesh", leftItems: [{ text: "Paracetamol IP (500 kg)", type: "label", arrowDir: "right" }], rightItems: [{ text: "Sifter S-101", type: "equipment", arrowDir: "left" }] },
        { id: "n2", text: "Load into RMG and dry mix for 10 min", leftItems: [{ text: "Starch (25 kg)", type: "label", arrowDir: "right" }], rightItems: [{ text: "RMG-201", type: "equipment", arrowDir: "left" }] },
        { id: "n3", text: "Add binder solution and granulate", leftItems: [{ text: "PVP K30 Solution (40 L)", type: "label", arrowDir: "right" }], rightItems: [{ text: "IPQC: Check granule size", type: "ipqc", arrowDir: "left" }] },
        { id: "n4", text: "Dry in FBD at 55°C until LOD ≤ 2%", leftItems: [], rightItems: [{ text: "FBD-301", type: "equipment", arrowDir: "left" }, { text: "IPQC: LOD Check", type: "ipqc", arrowDir: "left" }] },
      ]);
      const approvedSettings = JSON.stringify({ finalized: true });
      const approvedId = await ctx.db.insert("diagrams", {
        name: "Sample: Paracetamol Granulation",
        ownerId: demoUser.clerkId,
        ownerName: demoUser.name,
        blocks: approvedBlocks,
        arrowAnnotations: JSON.stringify({}),
        settings: approvedSettings,
        status: "approved",
        currentRevision: 0,
        finalized: true,
        finalizedBy: demoUser.clerkId,
        finalizedByName: demoUser.name,
        finalizedAt: Date.now() - 86000000,
        approvedBy: demoApprover.clerkId,
        approvedByName: demoApprover.name,
        approvedAt: Date.now(),
        isDemo: true,
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now(),
      });
      await ctx.db.insert("diagram_versions", {
        diagramId: approvedId,
        revisionNumber: 0,
        name: "Sample: Paracetamol Granulation",
        blocks: approvedBlocks,
        arrowAnnotations: JSON.stringify({}),
        settings: approvedSettings,
        statusAtSnapshot: "approved",
        snapshotType: "approved_snapshot",
        submittedBy: demoUser.clerkId,
        submittedByName: demoUser.name,
        submittedAt: Date.now() - 86000000,
        submittedRemarks: "Demo submitted for approval.",
        approvedBy: demoApprover.clerkId,
        approvedByName: demoApprover.name,
        approvedAt: Date.now(),
        approvalRemarks: "Demo approval completed.",
        createdAt: Date.now() - 86000000,
      });
    }

    const submittedBlocks = JSON.stringify([
      { id: "n1", text: "Load coated tablets into coating pan", leftItems: [], rightItems: [{ text: "Coating Pan CP-401", type: "equipment", arrowDir: "left" }] },
      { id: "n2", text: "Prepare HPMC coating solution", leftItems: [{ text: "HPMC E5 (8 kg)", type: "label", arrowDir: "right" }, { text: "Purified Water (80 L)", type: "label", arrowDir: "right" }], rightItems: [] },
      { id: "n3", text: "Spray coating at 45°C inlet temp", leftItems: [], rightItems: [{ text: "IPQC: Weight gain 3±0.5%", type: "ipqc", arrowDir: "left" }] },
      { id: "n4", text: "Cool and unload coated tablets", leftItems: [], rightItems: [{ text: "IPQC: Appearance check", type: "ipqc", arrowDir: "left" }] },
    ]);
    const submittedSettings = JSON.stringify({ finalized: true });
    const submittedId = await ctx.db.insert("diagrams", {
      name: "Sample: Amoxicillin Coating",
      ownerId: demoUser.clerkId,
      ownerName: demoUser.name,
      blocks: submittedBlocks,
      arrowAnnotations: JSON.stringify({}),
      settings: submittedSettings,
      status: "submitted",
      currentRevision: 0,
      finalized: true,
      finalizedBy: demoUser.clerkId,
      finalizedByName: demoUser.name,
      finalizedAt: Date.now() - 3600000,
      isDemo: true,
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now(),
    });
    await ctx.db.insert("diagram_versions", {
      diagramId: submittedId,
      revisionNumber: 0,
      name: "Sample: Amoxicillin Coating",
      blocks: submittedBlocks,
      arrowAnnotations: JSON.stringify({}),
      settings: submittedSettings,
      statusAtSnapshot: "submitted",
      snapshotType: "submitted_snapshot",
      submittedBy: demoUser.clerkId,
      submittedByName: demoUser.name,
      submittedAt: Date.now() - 3600000,
      submittedRemarks: "Demo submission awaiting approver review.",
      createdAt: Date.now() - 3600000,
    });
  },
});

export const isDemoUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;
    const user = await ctx.db.query("users").withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject)).unique();
    return user?.isDemo || false;
  },
});

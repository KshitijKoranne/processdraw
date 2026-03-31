import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";

// List of demo Clerk user IDs — these will be populated after you create the demo accounts in Clerk
// For now, we identify demo users by the isDemo flag in the users table

// Internal mutation called by cron job: wipes all demo diagrams and notifications
export const wipeDemoData = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Find all demo users
    const allUsers = await ctx.db.query("users").collect();
    const demoUsers = allUsers.filter((u) => u.isDemo);
    const demoUserIds = demoUsers.map((u) => u.clerkId);

    if (demoUserIds.length === 0) return;

    // Delete all diagrams owned by demo users
    const allDiagrams = await ctx.db.query("diagrams").collect();
    const demoDiagrams = allDiagrams.filter((d) => demoUserIds.includes(d.ownerId));
    for (const d of demoDiagrams) {
      await ctx.db.delete(d._id);
    }

    // Delete all notifications for demo users
    const allNotifs = await ctx.db.query("notifications").collect();
    const demoNotifs = allNotifs.filter((n) => demoUserIds.includes(n.userId));
    for (const n of demoNotifs) {
      await ctx.db.delete(n._id);
    }

    // Delete demo audit logs
    const allLogs = await ctx.db.query("audit_log").collect();
    const demoLogs = allLogs.filter((l) => demoUserIds.includes(l.actorId));
    for (const l of demoLogs) {
      await ctx.db.delete(l._id);
    }

    // Reseed sample data
    const demoUser = demoUsers.find((u) => u.role === "user");
    const demoApprover = demoUsers.find((u) => u.role === "approver");

    if (demoUser) {
      // Sample draft diagram
      await ctx.db.insert("diagrams", {
        name: "Sample: Ibuprofen Synthesis",
        ownerId: demoUser.clerkId, ownerName: demoUser.name,
        blocks: JSON.stringify([
          { id: "n1", text: "Charge Isobutylbenzene to Reactor R-101", leftItems: [{ text: "Isobutylbenzene (200 kg)", type: "label", arrowDir: "right" }], rightItems: [{ text: "Reactor R-101", type: "equipment", arrowDir: "left" }] },
          { id: "n2", text: "Add Acetic Anhydride under stirring", leftItems: [{ text: "Acetic Anhydride (150 kg)", type: "label", arrowDir: "right" }], rightItems: [{ text: "IPQC: Check temp ≤ 45°C", type: "ipqc", arrowDir: "left" }] },
          { id: "n3", text: "Heat to 85°C and maintain for 4 hours", leftItems: [], rightItems: [{ text: "IPQC: Check reaction completion by TLC", type: "ipqc", arrowDir: "left" }] },
          { id: "n4", text: "Cool to 25°C and filter", leftItems: [{ text: "Mother Liquor", type: "label", arrowDir: "left" }], rightItems: [{ text: "Filter Press FP-201", type: "equipment", arrowDir: "left" }] },
          { id: "n5", text: "Wash with Purified Water (3x)", leftItems: [{ text: "Purified Water (300 L)", type: "label", arrowDir: "right" }], rightItems: [] },
          { id: "n6", text: "Dry in Tray Dryer at 60°C for 12 hours", leftItems: [], rightItems: [{ text: "Tray Dryer TD-301", type: "equipment", arrowDir: "left" }, { text: "IPQC: Check LOD ≤ 0.5%", type: "ipqc", arrowDir: "left" }] },
        ]),
        arrowAnnotations: JSON.stringify({ 2: { left: [{ text: "Wet Cake" }], right: [] } }),
        settings: JSON.stringify({}),
        status: "draft",
        isDemo: true,
        createdAt: Date.now(), updatedAt: Date.now(),
      });

      // Sample approved diagram
      if (demoApprover) {
        await ctx.db.insert("diagrams", {
          name: "Sample: Paracetamol Granulation",
          ownerId: demoUser.clerkId, ownerName: demoUser.name,
          blocks: JSON.stringify([
            { id: "n1", text: "Sift Paracetamol through 40# mesh", leftItems: [{ text: "Paracetamol IP (500 kg)", type: "label", arrowDir: "right" }], rightItems: [{ text: "Sifter S-101", type: "equipment", arrowDir: "left" }] },
            { id: "n2", text: "Load into RMG and dry mix for 10 min", leftItems: [{ text: "Starch (25 kg)", type: "label", arrowDir: "right" }], rightItems: [{ text: "RMG-201", type: "equipment", arrowDir: "left" }] },
            { id: "n3", text: "Add binder solution and granulate", leftItems: [{ text: "PVP K30 Solution (40 L)", type: "label", arrowDir: "right" }], rightItems: [{ text: "IPQC: Check granule size", type: "ipqc", arrowDir: "left" }] },
            { id: "n4", text: "Dry in FBD at 55°C until LOD ≤ 2%", leftItems: [], rightItems: [{ text: "FBD-301", type: "equipment", arrowDir: "left" }, { text: "IPQC: LOD Check", type: "ipqc", arrowDir: "left" }] },
          ]),
          arrowAnnotations: JSON.stringify({}),
          settings: JSON.stringify({}),
          status: "approved",
          approvedBy: demoApprover.clerkId,
          approvedByName: demoApprover.name,
          approvedAt: Date.now(),
          isDemo: true,
          createdAt: Date.now() - 86400000, updatedAt: Date.now(),
        });
      }

      // Sample submitted diagram (for approver to review)
      await ctx.db.insert("diagrams", {
        name: "Sample: Amoxicillin Coating",
        ownerId: demoUser.clerkId, ownerName: demoUser.name,
        blocks: JSON.stringify([
          { id: "n1", text: "Load coated tablets into coating pan", leftItems: [], rightItems: [{ text: "Coating Pan CP-401", type: "equipment", arrowDir: "left" }] },
          { id: "n2", text: "Prepare HPMC coating solution", leftItems: [{ text: "HPMC E5 (8 kg)", type: "label", arrowDir: "right" }, { text: "Purified Water (80 L)", type: "label", arrowDir: "right" }], rightItems: [] },
          { id: "n3", text: "Spray coating at 45°C inlet temp", leftItems: [], rightItems: [{ text: "IPQC: Weight gain 3±0.5%", type: "ipqc", arrowDir: "left" }] },
          { id: "n4", text: "Cool and unload coated tablets", leftItems: [], rightItems: [{ text: "IPQC: Appearance check", type: "ipqc", arrowDir: "left" }] },
        ]),
        arrowAnnotations: JSON.stringify({}),
        settings: JSON.stringify({}),
        status: "submitted",
        isDemo: true,
        createdAt: Date.now() - 3600000, updatedAt: Date.now(),
      });
    }
  },
});

// Check if current user is a demo user
export const isDemoUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;
    const user = await ctx.db.query("users").withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject)).unique();
    return user?.isDemo || false;
  },
});

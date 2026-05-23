import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { logAction } from "./auditLog";

async function getAuthUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  const user = await ctx.db.query("users").withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject)).unique();
  if (!user) throw new Error("User not found");
  if (user.disabled) throw new Error("Your account has been disabled. Contact your administrator.");
  return user;
}
const required = (value: string | undefined, label: string) => { const text = value?.trim(); if (!text) throw new Error(`${label} remarks are required`); return text; };
const parseSettings = (raw?: string) => { try { return raw ? JSON.parse(raw) : {}; } catch { return {}; } };
const withFinalized = (raw: string | undefined, finalized: boolean) => JSON.stringify({ ...parseSettings(raw), finalized });
const canAccessDiagram = (user: any, diagram: any) => {
  if (user.isDemo !== !!diagram.isDemo) return false;
  if (user.role === "it_admin") return true;
  if (user.role === "user") return diagram.ownerId === user.clerkId;
  if (user.role === "approver") return ["submitted", "approved", "rejected"].includes(diagram.status);
  if (user.role === "viewer") return diagram.status === "approved";
  return false;
};
async function getLatestVersion(ctx: any, diagramId: any) { const versions = await ctx.db.query("diagram_versions").withIndex("by_diagram", (q: any) => q.eq("diagramId", diagramId)).collect(); return versions.sort((a: any, b: any) => b.revisionNumber - a.revisionNumber)[0] || null; }
async function getNextRevision(ctx: any, diagramId: any) { const versions = await ctx.db.query("diagram_versions").withIndex("by_diagram", (q: any) => q.eq("diagramId", diagramId)).collect(); return versions.length ? Math.max(...versions.map((item: any) => item.revisionNumber)) + 1 : 0; }

export const create = mutation({
  args: { name: v.string(), blocks: v.string(), arrowAnnotations: v.string(), settings: v.string() },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (user.role !== "user") throw new Error("Only users can create diagrams");
    const id = await ctx.db.insert("diagrams", { name: args.name, ownerId: user.clerkId, ownerName: user.name, blocks: args.blocks, arrowAnnotations: args.arrowAnnotations, settings: withFinalized(args.settings, false), status: "draft", finalized: false, isDemo: !!user.isDemo, createdAt: Date.now(), updatedAt: Date.now() });
    await logAction(ctx, { action: "diagram_created", actorId: user.clerkId, actorName: user.name, actorEmail: user.email, targetType: "diagram", targetId: id, targetName: args.name, details: JSON.stringify({ isDemo: !!user.isDemo }) });
    return id;
  },
});

export const update = mutation({
  args: { diagramId: v.id("diagrams"), name: v.optional(v.string()), blocks: v.optional(v.string()), arrowAnnotations: v.optional(v.string()), settings: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (user.role !== "user") throw new Error("Only users can edit diagrams");
    const diagram = await ctx.db.get(args.diagramId);
    if (!diagram) throw new Error("Diagram not found");
    if (diagram.isDemo !== !!user.isDemo) throw new Error("Demo and real data are isolated");
    if (diagram.ownerId !== user.clerkId) throw new Error("Can only edit your own diagrams");
    if (diagram.status !== "draft") throw new Error("Only draft diagrams can be edited");
    const updates: any = { updatedAt: Date.now(), finalized: false, finalizedBy: undefined, finalizedByName: undefined, finalizedAt: undefined };
    if (args.name !== undefined) updates.name = args.name;
    if (args.blocks !== undefined) updates.blocks = args.blocks;
    if (args.arrowAnnotations !== undefined) updates.arrowAnnotations = args.arrowAnnotations;
    if (args.settings !== undefined) updates.settings = withFinalized(args.settings, false);
    await ctx.db.patch(args.diagramId, updates);
    await logAction(ctx, { action: "diagram_updated", actorId: user.clerkId, actorName: user.name, actorEmail: user.email, targetType: "diagram", targetId: args.diagramId, targetName: args.name || diagram.name });
  },
});

export const remove = mutation({
  args: { diagramId: v.id("diagrams") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (user.role !== "user") throw new Error("Only users can delete diagrams");
    const diagram = await ctx.db.get(args.diagramId);
    if (!diagram) throw new Error("Diagram not found");
    if (diagram.isDemo !== !!user.isDemo) throw new Error("Demo and real data are isolated");
    if (diagram.ownerId !== user.clerkId) throw new Error("Can only delete your own diagrams");
    if (diagram.status !== "draft") throw new Error("Only draft diagrams can be deleted");
    await ctx.db.delete(args.diagramId);
    await logAction(ctx, { action: "diagram_deleted", actorId: user.clerkId, actorName: user.name, actorEmail: user.email, targetType: "diagram", targetId: args.diagramId, targetName: diagram.name });
  },
});

export const submit = mutation({
  args: { diagramId: v.id("diagrams"), remarks: v.string() },
  handler: async (ctx, args) => {
    const remarks = required(args.remarks, "Submission");
    const user = await getAuthUser(ctx);
    if (user.role !== "user") throw new Error("Only users can submit diagrams");
    const diagram = await ctx.db.get(args.diagramId);
    if (!diagram) throw new Error("Diagram not found");
    if (diagram.isDemo !== !!user.isDemo) throw new Error("Demo and real data are isolated");
    if (diagram.ownerId !== user.clerkId) throw new Error("Can only submit your own diagrams");
    if (diagram.status !== "draft") throw new Error("Only draft diagrams can be submitted");
    const revisionNumber = await getNextRevision(ctx, args.diagramId);
    const finalizedSettings = withFinalized(diagram.settings, true);
    await ctx.db.insert("diagram_versions", { diagramId: args.diagramId, revisionNumber, name: diagram.name, blocks: diagram.blocks, arrowAnnotations: diagram.arrowAnnotations, settings: finalizedSettings, statusAtSnapshot: "submitted", snapshotType: "submitted_snapshot", submittedBy: user.clerkId, submittedByName: user.name, submittedAt: Date.now(), submittedRemarks: remarks, createdAt: Date.now() });
    await ctx.db.patch(args.diagramId, { status: "submitted", settings: finalizedSettings, finalized: true, finalizedBy: user.clerkId, finalizedByName: user.name, finalizedAt: Date.now(), currentRevision: revisionNumber, updatedAt: Date.now() });
    const allUsers = await ctx.db.query("users").collect();
    for (const approver of allUsers.filter((item) => item.role === "approver" && item.isDemo === !!user.isDemo && !item.disabled)) await ctx.db.insert("notifications", { userId: approver.clerkId, type: "submitted", diagramId: String(args.diagramId), diagramName: diagram.name, actorName: user.name, comment: remarks, read: false, createdAt: Date.now() });
    await logAction(ctx, { action: "diagram_submitted", actorId: user.clerkId, actorName: user.name, actorEmail: user.email, targetType: "diagram", targetId: args.diagramId, targetName: diagram.name, details: JSON.stringify({ revisionNumber, remarks, finalizedByServer: true }) });
  },
});

export const review = mutation({
  args: { diagramId: v.id("diagrams"), decision: v.string(), remarks: v.string() },
  handler: async (ctx, args) => {
    const remarks = required(args.remarks, "Review");
    const user = await getAuthUser(ctx);
    if (user.role !== "approver") throw new Error("Only approvers can review diagrams");
    if (!["approved", "rejected"].includes(args.decision)) throw new Error("Invalid decision");
    const diagram = await ctx.db.get(args.diagramId);
    if (!diagram) throw new Error("Diagram not found");
    if (diagram.isDemo !== !!user.isDemo) throw new Error("Demo and real data are isolated");
    if (diagram.status !== "submitted") throw new Error("Only submitted diagrams can be reviewed");
    if (diagram.finalized !== true) throw new Error("Cannot review a diagram that was not finalized by the server");
    const version = await getLatestVersion(ctx, args.diagramId);
    if (!version) throw new Error("No submitted snapshot found for review");
    if (args.decision === "approved") {
      await ctx.db.patch(version._id, { statusAtSnapshot: "approved", snapshotType: "approved_snapshot", approvedBy: user.clerkId, approvedByName: user.name, approvedAt: Date.now(), approvalRemarks: remarks });
      await ctx.db.patch(args.diagramId, { status: "approved", approvedBy: user.clerkId, approvedByName: user.name, approvedAt: Date.now(), updatedAt: Date.now() });
    } else {
      await ctx.db.patch(version._id, { statusAtSnapshot: "rejected", snapshotType: "rejected_snapshot", rejectedBy: user.clerkId, rejectedByName: user.name, rejectedAt: Date.now(), rejectionRemarks: remarks });
      await ctx.db.patch(args.diagramId, { status: "rejected", rejectedBy: user.clerkId, rejectedByName: user.name, rejectionComment: remarks, rejectedAt: Date.now(), updatedAt: Date.now() });
    }
    await ctx.db.insert("notifications", { userId: diagram.ownerId, type: args.decision, diagramId: String(args.diagramId), diagramName: diagram.name, actorName: user.name, comment: remarks, read: false, createdAt: Date.now() });
    await logAction(ctx, { action: args.decision === "approved" ? "diagram_approved" : "diagram_rejected", actorId: user.clerkId, actorName: user.name, actorEmail: user.email, targetType: "diagram", targetId: args.diagramId, targetName: diagram.name, details: JSON.stringify({ previousStatus: diagram.status, revisionNumber: version.revisionNumber, remarks }) });
  },
});

export const sendBack = mutation({
  args: { diagramId: v.id("diagrams"), remarks: v.string() },
  handler: async (ctx, args) => {
    const remarks = required(args.remarks, "Revert");
    const user = await getAuthUser(ctx);
    if (user.role !== "approver") throw new Error("Only approvers can revert diagrams");
    const diagram = await ctx.db.get(args.diagramId);
    if (!diagram) throw new Error("Diagram not found");
    if (diagram.isDemo !== !!user.isDemo) throw new Error("Demo and real data are isolated");
    if (diagram.status !== "submitted") throw new Error("Only submitted diagrams can be reverted");
    const version = await getLatestVersion(ctx, args.diagramId);
    if (version) await ctx.db.patch(version._id, { statusAtSnapshot: "reverted", snapshotType: "reverted_snapshot", revertedBy: user.clerkId, revertedByName: user.name, revertedAt: Date.now(), revertRemarks: remarks });
    await ctx.db.patch(args.diagramId, { status: "draft", settings: withFinalized(diagram.settings, false), finalized: false, finalizedBy: undefined, finalizedByName: undefined, finalizedAt: undefined, revertedBy: user.clerkId, revertedByName: user.name, revertComment: remarks, revertedAt: Date.now(), updatedAt: Date.now() });
    await ctx.db.insert("notifications", { userId: diagram.ownerId, type: "reverted", diagramId: String(args.diagramId), diagramName: diagram.name, actorName: user.name, comment: remarks, read: false, createdAt: Date.now() });
    await logAction(ctx, { action: "diagram_reverted", actorId: user.clerkId, actorName: user.name, actorEmail: user.email, targetType: "diagram", targetId: args.diagramId, targetName: diagram.name, details: JSON.stringify({ revisionNumber: version?.revisionNumber ?? null, remarks, finalizedReset: true }) });
  },
});

export const revise = mutation({
  args: { diagramId: v.id("diagrams"), remarks: v.string() },
  handler: async (ctx, args) => {
    const remarks = required(args.remarks, "Revision");
    const user = await getAuthUser(ctx);
    if (user.role !== "user") throw new Error("Only users can revise diagrams");
    const diagram = await ctx.db.get(args.diagramId);
    if (!diagram) throw new Error("Diagram not found");
    if (diagram.isDemo !== !!user.isDemo) throw new Error("Demo and real data are isolated");
    if (diagram.ownerId !== user.clerkId) throw new Error("Can only revise your own diagrams");
    if (diagram.status === "rejected") throw new Error("Rejected diagrams cannot be revised. Create a new diagram if needed.");
    if (diagram.status !== "draft") throw new Error("Only draft diagrams can be revised");
    await ctx.db.patch(args.diagramId, { settings: withFinalized(diagram.settings, false), finalized: false, finalizedBy: undefined, finalizedByName: undefined, finalizedAt: undefined, revisionCount: (diagram.revisionCount || 0) + 1, updatedAt: Date.now() });
    await logAction(ctx, { action: "diagram_revised", actorId: user.clerkId, actorName: user.name, actorEmail: user.email, targetType: "diagram", targetId: args.diagramId, targetName: diagram.name, details: JSON.stringify({ revisionNumber: (diagram.revisionCount || 0) + 1, remarks, finalizedReset: true }) });
  },
});

export const listVersions = query({
  args: { diagramId: v.id("diagrams") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    const diagram = await ctx.db.get(args.diagramId);
    if (!diagram || !canAccessDiagram(user, diagram)) return [];
    return await ctx.db.query("diagram_versions").withIndex("by_diagram", (q) => q.eq("diagramId", args.diagramId)).collect();
  },
});

export const listOwn = query({ args: {}, handler: async (ctx) => { const user = await getAuthUser(ctx); return await ctx.db.query("diagrams").withIndex("by_owner", (q) => q.eq("ownerId", user.clerkId)).order("desc").collect(); } });

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    const all = await ctx.db.query("diagrams").order("desc").collect();
    return all.filter((d) => canAccessDiagram(user, d));
  },
});

export const listSubmitted = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    if (user.role !== "approver" && user.role !== "it_admin") return [];
    const submitted = await ctx.db.query("diagrams").withIndex("by_status", (q) => q.eq("status", "submitted")).order("desc").collect();
    return submitted.filter((d) => d.isDemo === !!user.isDemo);
  },
});

export const get = query({
  args: { diagramId: v.id("diagrams") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    const diagram = await ctx.db.get(args.diagramId);
    if (!diagram || !canAccessDiagram(user, diagram)) return null;
    return diagram;
  },
});

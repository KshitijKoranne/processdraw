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

function required(value: string | undefined, label: string) {
  const text = value?.trim();
  if (!text) throw new Error(`${label} remarks are required`);
  return text;
}

function parseSettings(raw: string | undefined) {
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

function withFinalized(raw: string | undefined, finalized: boolean) {
  return JSON.stringify({ ...parseSettings(raw), finalized });
}

async function getLatestVersion(ctx: any, diagramId: any) {
  const versions = await ctx.db.query("diagram_versions").withIndex("by_diagram", (q: any) => q.eq("diagramId", diagramId)).collect();
  return versions.sort((a: any, b: any) => b.revisionNumber - a.revisionNumber)[0] || null;
}

async function getNextRevision(ctx: any, diagramId: any) {
  const versions = await ctx.db.query("diagram_versions").withIndex("by_diagram", (q: any) => q.eq("diagramId", diagramId)).collect();
  return versions.length ? Math.max(...versions.map((item: any) => item.revisionNumber)) + 1 : 0;
}

export const create = mutation({
  args: { name: v.string(), blocks: v.string(), arrowAnnotations: v.string(), settings: v.string() },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (user.role !== "user") throw new Error("Only users can create diagrams");
    const id = await ctx.db.insert("diagrams", {
      name: args.name,
      ownerId: user.clerkId,
      ownerName: user.name,
      blocks: args.blocks,
      arrowAnnotations: args.arrowAnnotations,
      settings: args.settings,
      status: "draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await logAction(ctx, { action: "diagram_created", actorId: user.clerkId, actorName: user.name, actorEmail: user.email, targetType: "diagram", targetId: id, targetName: args.name });
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
    if (diagram.ownerId !== user.clerkId) throw new Error("Can only edit your own diagrams");
    if (diagram.status !== "draft") throw new Error("Only draft diagrams can be edited");
    const updates: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.blocks !== undefined) updates.blocks = args.blocks;
    if (args.arrowAnnotations !== undefined) updates.arrowAnnotations = args.arrowAnnotations;
    if (args.settings !== undefined) updates.settings = args.settings;
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
    if (diagram.ownerId !== user.clerkId) throw new Error("Can only delete your own diagrams");
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
    if (diagram.ownerId !== user.clerkId) throw new Error("Can only submit your own diagrams");
    if (diagram.status !== "draft") throw new Error("Only draft diagrams can be submitted");
    if (parseSettings(diagram.settings).finalized !== true) throw new Error("Please click END / Preview and save before submitting");

    const revisionNumber = await getNextRevision(ctx, args.diagramId);
    await ctx.db.insert("diagram_versions", {
      diagramId: args.diagramId,
      revisionNumber,
      name: diagram.name,
      blocks: diagram.blocks,
      arrowAnnotations: diagram.arrowAnnotations,
      settings: diagram.settings,
      statusAtSnapshot: "submitted",
      snapshotType: "submitted_snapshot",
      submittedBy: user.clerkId,
      submittedByName: user.name,
      submittedAt: Date.now(),
      submittedRemarks: remarks,
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.diagramId, { status: "submitted", currentRevision: revisionNumber, updatedAt: Date.now() });

    const allUsers = await ctx.db.query("users").collect();
    for (const approver of allUsers.filter((item) => item.role === "approver")) {
      await ctx.db.insert("notifications", { userId: approver.clerkId, type: "submitted", diagramId: String(args.diagramId), diagramName: diagram.name, actorName: user.name, comment: remarks, read: false, createdAt: Date.now() });
    }

    await logAction(ctx, { action: "diagram_submitted", actorId: user.clerkId, actorName: user.name, actorEmail: user.email, targetType: "diagram", targetId: args.diagramId, targetName: diagram.name, details: JSON.stringify({ revisionNumber, remarks }) });
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
    if (diagram.status !== "submitted") throw new Error("Only submitted diagrams can be reviewed");
    if (parseSettings(diagram.settings).finalized !== true) throw new Error("Cannot review a diagram that was not finalized before submission");
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
    if (diagram.status !== "submitted") throw new Error("Only submitted diagrams can be reverted");
    const version = await getLatestVersion(ctx, args.diagramId);
    if (version) await ctx.db.patch(version._id, { statusAtSnapshot: "reverted", snapshotType: "reverted_snapshot", revertedBy: user.clerkId, revertedByName: user.name, revertedAt: Date.now(), revertRemarks: remarks });

    await ctx.db.patch(args.diagramId, { status: "draft", settings: withFinalized(diagram.settings, false), rejectedBy: user.clerkId, rejectedByName: user.name, rejectionComment: remarks, rejectedAt: Date.now(), updatedAt: Date.now() });
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
    if (diagram.ownerId !== user.clerkId) throw new Error("Can only revise your own diagrams");
    if (diagram.status === "rejected") throw new Error("Rejected diagrams cannot be revised. Create a new diagram if needed.");
    if (diagram.status !== "draft") throw new Error("Only draft diagrams can be revised");
    await ctx.db.patch(args.diagramId, { settings: withFinalized(diagram.settings, false), revisionCount: (diagram.revisionCount || 0) + 1, updatedAt: Date.now() });
    await logAction(ctx, { action: "diagram_revised", actorId: user.clerkId, actorName: user.name, actorEmail: user.email, targetType: "diagram", targetId: args.diagramId, targetName: diagram.name, details: JSON.stringify({ revisionNumber: (diagram.revisionCount || 0) + 1, remarks, finalizedReset: true }) });
  },
});

export const listVersions = query({
  args: { diagramId: v.id("diagrams") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    const diagram = await ctx.db.get(args.diagramId);
    if (!diagram) return [];
    if (user.role === "user" && diagram.ownerId !== user.clerkId) return [];
    if (user.role === "viewer" && diagram.status !== "approved") return [];
    return await ctx.db.query("diagram_versions").withIndex("by_diagram", (q) => q.eq("diagramId", args.diagramId)).collect();
  },
});

export const listOwn = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db.query("diagrams").withIndex("by_owner", (q) => q.eq("ownerId", identity.subject)).order("desc").collect();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db.query("users").withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject)).unique();
    if (!user) return [];
    const all = await ctx.db.query("diagrams").order("desc").collect();
    switch (user.role) {
      case "it_admin": return all;
      case "approver": return all.filter((d) => d.status === "submitted" || d.status === "approved" || d.status === "rejected");
      case "user": return all.filter((d) => d.ownerId === user.clerkId);
      case "viewer": return all.filter((d) => d.status === "approved");
      default: return [];
    }
  },
});

export const listSubmitted = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db.query("users").withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject)).unique();
    if (!user || (user.role !== "approver" && user.role !== "it_admin")) return [];
    return await ctx.db.query("diagrams").withIndex("by_status", (q) => q.eq("status", "submitted")).order("desc").collect();
  },
});

export const get = query({
  args: { diagramId: v.id("diagrams") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db.query("users").withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject)).unique();
    if (!user) return null;
    const diagram = await ctx.db.get(args.diagramId);
    if (!diagram) return null;
    if (user.role === "viewer" && diagram.status !== "approved") return null;
    if (user.role === "user" && diagram.ownerId !== user.clerkId) return null;
    if (user.role === "approver" && diagram.status !== "submitted" && diagram.status !== "approved" && diagram.status !== "rejected") return null;
    return diagram;
  },
});

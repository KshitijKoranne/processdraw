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

// Only "user" role can create diagrams
export const create = mutation({
  args: { name: v.string(), blocks: v.string(), arrowAnnotations: v.string(), settings: v.string() },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (user.role !== "user") throw new Error("Only users can create diagrams");
    const id = await ctx.db.insert("diagrams", {
      name: args.name, ownerId: user.clerkId, ownerName: user.name,
      blocks: args.blocks, arrowAnnotations: args.arrowAnnotations,
      settings: args.settings, status: "draft",
      createdAt: Date.now(), updatedAt: Date.now(),
    });
    await logAction(ctx, { action: "diagram_created", actorId: user.clerkId, actorName: user.name, actorEmail: user.email, targetType: "diagram", targetId: id, targetName: args.name });
    return id;
  },
});

// Only owner (user role) can edit their own diagrams
export const update = mutation({
  args: { diagramId: v.id("diagrams"), name: v.optional(v.string()), blocks: v.optional(v.string()), arrowAnnotations: v.optional(v.string()), settings: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (user.role !== "user") throw new Error("Only users can edit diagrams");
    const diagram = await ctx.db.get(args.diagramId);
    if (!diagram) throw new Error("Diagram not found");
    if (diagram.ownerId !== user.clerkId) throw new Error("Can only edit your own diagrams");
    const updates: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.blocks !== undefined) updates.blocks = args.blocks;
    if (args.arrowAnnotations !== undefined) updates.arrowAnnotations = args.arrowAnnotations;
    if (args.settings !== undefined) updates.settings = args.settings;
    await ctx.db.patch(args.diagramId, updates);
    await logAction(ctx, { action: "diagram_updated", actorId: user.clerkId, actorName: user.name, actorEmail: user.email, targetType: "diagram", targetId: args.diagramId, targetName: args.name || diagram.name });
  },
});

// Only owner (user role) can delete their own diagrams
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

// Only owner (user role) can submit for approval
export const submit = mutation({
  args: { diagramId: v.id("diagrams") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (user.role !== "user") throw new Error("Only users can submit diagrams");
    const diagram = await ctx.db.get(args.diagramId);
    if (!diagram) throw new Error("Diagram not found");
    if (diagram.ownerId !== user.clerkId) throw new Error("Can only submit your own diagrams");

    await ctx.db.patch(args.diagramId, { status: "submitted", updatedAt: Date.now() });

    // Notify all approvers (not IT admins — they don't review)
    const allUsers = await ctx.db.query("users").collect();
    const approvers = allUsers.filter((u) => u.role === "approver");
    for (const approver of approvers) {
      await ctx.db.insert("notifications", {
        userId: approver.clerkId, type: "submitted",
        diagramId: args.diagramId, diagramName: diagram.name,
        actorName: user.name, read: false, createdAt: Date.now(),
      });
    }

    await logAction(ctx, { action: "diagram_submitted", actorId: user.clerkId, actorName: user.name, actorEmail: user.email, targetType: "diagram", targetId: args.diagramId, targetName: diagram.name });
  },
});

// Only "approver" role can approve/reject
export const review = mutation({
  args: { diagramId: v.id("diagrams"), decision: v.string(), comment: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (user.role !== "approver") throw new Error("Only approvers can review diagrams");
    if (!["approved", "rejected"].includes(args.decision)) throw new Error("Invalid decision");
    if (args.decision === "rejected" && (!args.comment || !args.comment.trim())) throw new Error("Rejection reason is required");

    const diagram = await ctx.db.get(args.diagramId);
    if (!diagram) throw new Error("Diagram not found");

    if (args.decision === "approved") {
      await ctx.db.patch(args.diagramId, {
        status: "approved", approvedBy: user.clerkId, approvedByName: user.name,
        approvedAt: Date.now(), updatedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(args.diagramId, {
        status: "rejected", rejectedBy: user.clerkId, rejectedByName: user.name,
        rejectionComment: args.comment!.trim(), rejectedAt: Date.now(), updatedAt: Date.now(),
      });
    }

    // Notify diagram owner
    await ctx.db.insert("notifications", {
      userId: diagram.ownerId, type: args.decision,
      diagramId: args.diagramId, diagramName: diagram.name,
      actorName: user.name,
      comment: args.decision === "rejected" ? args.comment!.trim() : undefined,
      read: false, createdAt: Date.now(),
    });

    await logAction(ctx, {
      action: args.decision === "approved" ? "diagram_approved" : "diagram_rejected",
      actorId: user.clerkId, actorName: user.name, actorEmail: user.email,
      targetType: "diagram", targetId: args.diagramId, targetName: diagram.name,
      details: JSON.stringify({ previousStatus: diagram.status, comment: args.comment || null }),
    });
  },
});

// Only owner (user role) can revise rejected diagrams
export const revise = mutation({
  args: { diagramId: v.id("diagrams") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (user.role !== "user") throw new Error("Only users can revise diagrams");
    const diagram = await ctx.db.get(args.diagramId);
    if (!diagram) throw new Error("Diagram not found");
    if (diagram.ownerId !== user.clerkId) throw new Error("Can only revise your own diagrams");
    if (diagram.status !== "rejected") throw new Error("Only rejected diagrams can be revised");

    await ctx.db.patch(args.diagramId, {
      status: "draft", revisionCount: (diagram.revisionCount || 0) + 1, updatedAt: Date.now(),
    });

    await logAction(ctx, {
      action: "diagram_revised", actorId: user.clerkId, actorName: user.name, actorEmail: user.email,
      targetType: "diagram", targetId: args.diagramId, targetName: diagram.name,
      details: JSON.stringify({ revisionNumber: (diagram.revisionCount || 0) + 1 }),
    });
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

// Role-based visibility:
// IT Admin: sees all diagrams (for audit/oversight, but cannot act on them)
// User: sees only own diagrams
// Approver: sees ALL submitted diagrams (to review) + all approved ones
// Viewer: sees only approved diagrams
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db.query("users").withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject)).unique();
    if (!user) return [];
    const all = await ctx.db.query("diagrams").order("desc").collect();
    switch (user.role) {
      case "it_admin": return all; // oversight only
      case "approver":
        // Show ALL submitted diagrams (pending review) + all approved diagrams
        // This ensures approvers can always see everything awaiting their action
        return all.filter((d) => d.status === "submitted" || d.status === "approved");
      case "user": return all.filter((d) => d.ownerId === user.clerkId);
      case "viewer": return all.filter((d) => d.status === "approved");
      default: return [];
    }
  },
});

// Dedicated query for approvers to get only pending-review diagrams
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
    if (user.role === "approver" && diagram.status !== "submitted" && diagram.status !== "approved") return null;
    return diagram;
  },
});

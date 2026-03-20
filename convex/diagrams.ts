import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper: get authenticated user with role check
async function getAuthUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user) throw new Error("User not found");
  return user;
}

// Save a new diagram
export const create = mutation({
  args: {
    name: v.string(),
    blocks: v.string(),
    arrowAnnotations: v.string(),
    settings: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);

    if (user.role === "viewer") {
      throw new Error("Viewers cannot create diagrams");
    }

    return await ctx.db.insert("diagrams", {
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
  },
});

// Update an existing diagram
export const update = mutation({
  args: {
    diagramId: v.id("diagrams"),
    name: v.optional(v.string()),
    blocks: v.optional(v.string()),
    arrowAnnotations: v.optional(v.string()),
    settings: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    const diagram = await ctx.db.get(args.diagramId);
    if (!diagram) throw new Error("Diagram not found");

    // Users can only edit their own diagrams; IT Admin can edit any
    if (user.role !== "it_admin" && diagram.ownerId !== user.clerkId) {
      throw new Error("You can only edit your own diagrams");
    }
    if (user.role === "viewer") {
      throw new Error("Viewers cannot edit diagrams");
    }

    const updates: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.blocks !== undefined) updates.blocks = args.blocks;
    if (args.arrowAnnotations !== undefined) updates.arrowAnnotations = args.arrowAnnotations;
    if (args.settings !== undefined) updates.settings = args.settings;

    await ctx.db.patch(args.diagramId, updates);
  },
});

// Delete a diagram
export const remove = mutation({
  args: { diagramId: v.id("diagrams") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    const diagram = await ctx.db.get(args.diagramId);
    if (!diagram) throw new Error("Diagram not found");

    if (user.role !== "it_admin" && diagram.ownerId !== user.clerkId) {
      throw new Error("You can only delete your own diagrams");
    }
    if (user.role === "viewer") {
      throw new Error("Viewers cannot delete diagrams");
    }

    await ctx.db.delete(args.diagramId);
  },
});

// Submit diagram for approval
export const submit = mutation({
  args: { diagramId: v.id("diagrams") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    const diagram = await ctx.db.get(args.diagramId);
    if (!diagram) throw new Error("Diagram not found");

    if (diagram.ownerId !== user.clerkId && user.role !== "it_admin") {
      throw new Error("Only the owner can submit for approval");
    }

    await ctx.db.patch(args.diagramId, { status: "submitted", updatedAt: Date.now() });
  },
});

// Approve or reject a diagram (Approver / IT Admin only)
export const review = mutation({
  args: {
    diagramId: v.id("diagrams"),
    decision: v.string(), // "approved" | "rejected"
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);

    if (user.role !== "approver" && user.role !== "it_admin") {
      throw new Error("Only approvers can review diagrams");
    }

    if (!["approved", "rejected"].includes(args.decision)) {
      throw new Error("Invalid decision");
    }

    const diagram = await ctx.db.get(args.diagramId);
    if (!diagram) throw new Error("Diagram not found");

    await ctx.db.patch(args.diagramId, {
      status: args.decision,
      approvedBy: user.clerkId,
      approvedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// List own diagrams (for User role)
export const listOwn = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("diagrams")
      .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
      .order("desc")
      .collect();
  },
});

// List all diagrams (IT Admin sees all, Approver sees submitted+approved, Viewer sees approved)
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const all = await ctx.db
      .query("diagrams")
      .order("desc")
      .collect();

    switch (user.role) {
      case "it_admin":
        return all; // sees everything
      case "approver":
        return all.filter((d) => d.status === "submitted" || d.status === "approved" || d.ownerId === user.clerkId);
      case "user":
        return all.filter((d) => d.ownerId === user.clerkId); // only own
      case "viewer":
        return all.filter((d) => d.status === "approved"); // only approved
      default:
        return [];
    }
  },
});

// Get single diagram by ID
export const get = query({
  args: { diagramId: v.id("diagrams") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    const diagram = await ctx.db.get(args.diagramId);
    if (!diagram) return null;

    // Access control
    if (user.role === "viewer" && diagram.status !== "approved") return null;
    if (user.role === "user" && diagram.ownerId !== user.clerkId) return null;

    return diagram;
  },
});

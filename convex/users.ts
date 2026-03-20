import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get current user from Clerk identity
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    return user;
  },
});

// Create or update user on login (called from client after Clerk auth)
export const upsertUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existing) {
      // Update name/email if changed in Clerk
      await ctx.db.patch(existing._id, {
        name: identity.name || existing.name,
        email: identity.email || existing.email,
        imageUrl: identity.pictureUrl || existing.imageUrl,
      });
      return existing._id;
    }

    // First user becomes IT Admin, rest become "user"
    const allUsers = await ctx.db.query("users").collect();
    const role = allUsers.length === 0 ? "it_admin" : "user";

    return await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: identity.email || "",
      name: identity.name || "User",
      role,
      imageUrl: identity.pictureUrl,
      createdAt: Date.now(),
    });
  },
});

// List all users (IT Admin only)
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || currentUser.role !== "it_admin") return [];

    return await ctx.db.query("users").collect();
  },
});

// Update user role (IT Admin only)
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || currentUser.role !== "it_admin") {
      throw new Error("Only IT Admins can change roles");
    }

    const validRoles = ["it_admin", "user", "approver", "viewer"];
    if (!validRoles.includes(args.role)) {
      throw new Error("Invalid role");
    }

    await ctx.db.patch(args.userId, { role: args.role });
  },
});

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { logAction } from "./auditLog";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});

export const upsertUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Build name from available JWT fields
    const buildName = () => {
      if (identity.name && identity.name !== "User") return identity.name;
      const parts = [identity.givenName, identity.familyName].filter(Boolean);
      if (parts.length > 0) return parts.join(" ");
      if (identity.nickname) return identity.nickname;
      return "User";
    };

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existing) {
      const resolvedName = buildName();
      await ctx.db.patch(existing._id, {
        name: resolvedName !== "User" ? resolvedName : existing.name,
        email: identity.email || existing.email,
        imageUrl: identity.pictureUrl || existing.imageUrl,
      });

      await logAction(ctx, {
        action: "user_login",
        actorId: existing.clerkId,
        actorName: existing.name,
        actorEmail: existing.email,
      });

      return existing._id;
    }

    // New user — first user becomes IT Admin
    const allUsers = await ctx.db.query("users").collect();
    const role = allUsers.length === 0 ? "it_admin" : "user";
    const name = buildName();
    const email = identity.email || "";

    const id = await ctx.db.insert("users", {
      clerkId: identity.subject,
      email,
      name,
      role,
      imageUrl: identity.pictureUrl,
      createdAt: Date.now(),
    });

    await logAction(ctx, {
      action: "user_created",
      actorId: identity.subject,
      actorName: name,
      actorEmail: email,
      targetType: "user",
      targetId: identity.subject,
      targetName: name,
      details: JSON.stringify({ role, isFirstUser: allUsers.length === 0 }),
    });

    return id;
  },
});

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

export const updateUserRole = mutation({
  args: { userId: v.id("users"), role: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!currentUser || currentUser.role !== "it_admin") throw new Error("Only IT Admins can change roles");

    const validRoles = ["it_admin", "user", "approver", "viewer"];
    if (!validRoles.includes(args.role)) throw new Error("Invalid role");

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) throw new Error("User not found");

    const oldRole = targetUser.role;
    await ctx.db.patch(args.userId, { role: args.role });

    await logAction(ctx, {
      action: "role_changed",
      actorId: currentUser.clerkId,
      actorName: currentUser.name,
      actorEmail: currentUser.email,
      targetType: "user",
      targetId: targetUser.clerkId,
      targetName: targetUser.name,
      details: JSON.stringify({ oldRole, newRole: args.role }),
    });
  },
});

// Pre-register a user from create-employee API (sets name and role before first login)
export const preRegister = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    employeeCode: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (existing) return existing._id;

    const validRoles = ["it_admin", "user", "approver", "viewer"];
    if (!validRoles.includes(args.role)) throw new Error("Invalid role");

    const id = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.employeeCode, // use employee code as identifier
      name: args.name,
      role: args.role,
      createdAt: Date.now(),
    });

    await logAction(ctx, {
      action: "employee_created",
      actorId: args.clerkId,
      actorName: args.name,
      actorEmail: args.employeeCode,
      targetType: "user",
      targetId: args.clerkId,
      targetName: args.name,
      details: JSON.stringify({ role: args.role, employeeCode: args.employeeCode }),
    });

    return id;
  },
});

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get unread notification count for current user
export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q: any) => q.eq("userId", identity.subject).eq("read", false))
      .collect();
    return unread.length;
  },
});

// Get all notifications for current user (most recent first)
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const all = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q: any) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
    return all.slice(0, 50); // last 50 notifications
  },
});

// Mark a notification as read
export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const notif = await ctx.db.get(args.notificationId);
    if (!notif || notif.userId !== identity.subject) throw new Error("Not found");
    await ctx.db.patch(args.notificationId, { read: true });
  },
});

// Mark all notifications as read
export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q: any) => q.eq("userId", identity.subject).eq("read", false))
      .collect();
    for (const n of unread) {
      await ctx.db.patch(n._id, { read: true });
    }
  },
});

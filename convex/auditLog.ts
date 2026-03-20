import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Internal helper to log an action — called from other mutations
export async function logAction(
  ctx: any,
  data: {
    action: string;
    actorId: string;
    actorName: string;
    actorEmail: string;
    targetType?: string;
    targetId?: string;
    targetName?: string;
    details?: string;
  }
) {
  await ctx.db.insert("audit_log", {
    ...data,
    timestamp: Date.now(),
  });
}

// Query audit logs (IT Admin only) — most recent first
export const list = query({
  args: {
    limit: v.optional(v.number()),
    targetType: v.optional(v.string()),
    targetId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.role !== "it_admin") return [];

    let query;
    if (args.targetType && args.targetId) {
      query = ctx.db
        .query("audit_log")
        .withIndex("by_target", (q: any) =>
          q.eq("targetType", args.targetType).eq("targetId", args.targetId)
        )
        .order("desc");
    } else {
      query = ctx.db
        .query("audit_log")
        .withIndex("by_timestamp")
        .order("desc");
    }

    const results = await query.collect();
    return results.slice(0, args.limit || 100);
  },
});

// Get audit log for a specific diagram (owner or admin can see)
export const getForDiagram = query({
  args: { diagramId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    // Check access
    const diagram = await ctx.db
      .query("audit_log")
      .withIndex("by_target", (q: any) =>
        q.eq("targetType", "diagram").eq("targetId", args.diagramId)
      )
      .order("desc")
      .collect();

    // Admin sees all, others only see logs for their own diagrams
    if (user.role === "it_admin") return diagram;

    // Check if the diagram belongs to this user
    return diagram.filter(
      (log) => log.actorId === user.clerkId
    );
  },
});

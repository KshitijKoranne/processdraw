import { query } from "./_generated/server";
import { v } from "convex/values";

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
  await ctx.db.insert("audit_log", { ...data, timestamp: Date.now() });
}

function parseDetails(raw?: string) {
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

function sameDemoScope(user: any, log: any) {
  const details = parseDetails(log.details);
  if (details.isDemo !== undefined) return !!details.isDemo === !!user.isDemo;
  if (user.isDemo) return log.actorId === user.clerkId;
  return true;
}

export const list = query({
  args: { limit: v.optional(v.number()), targetType: v.optional(v.string()), targetId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db.query("users").withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject)).unique();
    if (!user || user.role !== "it_admin" || user.disabled) return [];

    let query;
    if (args.targetType && args.targetId) {
      query = ctx.db.query("audit_log").withIndex("by_target", (q: any) => q.eq("targetType", args.targetType).eq("targetId", args.targetId)).order("desc");
    } else {
      query = ctx.db.query("audit_log").withIndex("by_timestamp").order("desc");
    }

    const results = await query.collect();
    return results.filter((log: any) => sameDemoScope(user, log)).slice(0, args.limit || 100);
  },
});

export const getForDiagram = query({
  args: { diagramId: v.id("diagrams") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db.query("users").withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject)).unique();
    if (!user || user.disabled) return [];
    const diagram = await ctx.db.get(args.diagramId);
    if (!diagram || diagram.isDemo !== !!user.isDemo) return [];

    const allowed =
      user.role === "it_admin" ||
      (user.role === "user" && diagram.ownerId === user.clerkId) ||
      (user.role === "approver" && ["submitted", "approved", "rejected"].includes(diagram.status)) ||
      (user.role === "viewer" && diagram.status === "approved");
    if (!allowed) return [];

    return await ctx.db.query("audit_log").withIndex("by_target", (q: any) => q.eq("targetType", "diagram").eq("targetId", String(args.diagramId))).order("desc").collect();
  },
});

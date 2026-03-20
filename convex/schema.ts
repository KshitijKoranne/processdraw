import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table — synced from Clerk, with role assignment
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.string(),           // "it_admin" | "user" | "approver" | "viewer"
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  // Diagrams table
  diagrams: defineTable({
    name: v.string(),
    ownerId: v.string(),
    ownerName: v.string(),
    blocks: v.string(),
    arrowAnnotations: v.string(),
    settings: v.string(),
    status: v.string(),          // "draft" | "submitted" | "approved" | "rejected"
    approvedBy: v.optional(v.string()),
    approvedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_status", ["status"])
    .index("by_updated", ["updatedAt"]),

  // Audit log — immutable trail of every significant action
  audit_log: defineTable({
    action: v.string(),          // "user_created" | "role_changed" | "diagram_created" | "diagram_updated" | "diagram_deleted" | "diagram_submitted" | "diagram_approved" | "diagram_rejected" | "user_login"
    actorId: v.string(),         // Clerk user ID of who performed the action
    actorName: v.string(),       // Display name at time of action
    actorEmail: v.string(),      // Email at time of action
    targetType: v.optional(v.string()),   // "user" | "diagram"
    targetId: v.optional(v.string()),     // ID of affected entity
    targetName: v.optional(v.string()),   // Name of affected entity
    details: v.optional(v.string()),      // JSON stringified extra info (e.g. old role → new role)
    timestamp: v.number(),
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_actor", ["actorId"])
    .index("by_action", ["action"])
    .index("by_target", ["targetType", "targetId"]),
});

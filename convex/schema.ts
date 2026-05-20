import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.string(),
    imageUrl: v.optional(v.string()),
    disabled: v.optional(v.boolean()),
    isDemo: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  diagrams: defineTable({
    name: v.string(),
    ownerId: v.string(),
    ownerName: v.string(),
    blocks: v.string(),
    arrowAnnotations: v.string(),
    settings: v.string(),
    status: v.string(),
    currentRevision: v.optional(v.number()),
    approvedBy: v.optional(v.string()),
    approvedByName: v.optional(v.string()),
    approvedAt: v.optional(v.number()),
    rejectedBy: v.optional(v.string()),
    rejectedByName: v.optional(v.string()),
    rejectionComment: v.optional(v.string()),
    rejectedAt: v.optional(v.number()),
    revisionCount: v.optional(v.number()),
    isDemo: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_status", ["status"])
    .index("by_updated", ["updatedAt"]),

  diagram_versions: defineTable({
    diagramId: v.id("diagrams"),
    revisionNumber: v.number(),
    name: v.string(),
    blocks: v.string(),
    arrowAnnotations: v.string(),
    settings: v.string(),
    statusAtSnapshot: v.string(),
    snapshotType: v.string(),
    submittedBy: v.string(),
    submittedByName: v.string(),
    submittedAt: v.number(),
    submittedRemarks: v.string(),
    approvedBy: v.optional(v.string()),
    approvedByName: v.optional(v.string()),
    approvedAt: v.optional(v.number()),
    approvalRemarks: v.optional(v.string()),
    revertedBy: v.optional(v.string()),
    revertedByName: v.optional(v.string()),
    revertedAt: v.optional(v.number()),
    revertRemarks: v.optional(v.string()),
    rejectedBy: v.optional(v.string()),
    rejectedByName: v.optional(v.string()),
    rejectedAt: v.optional(v.number()),
    rejectionRemarks: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_diagram", ["diagramId"])
    .index("by_diagram_revision", ["diagramId", "revisionNumber"]),

  // Notifications — alerts for users when their diagrams are reviewed
  notifications: defineTable({
    userId: v.string(),
    type: v.string(),
    diagramId: v.string(),
    diagramName: v.string(),
    actorName: v.string(),
    comment: v.optional(v.string()),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "read"]),

  audit_log: defineTable({
    action: v.string(),
    actorId: v.string(),
    actorName: v.string(),
    actorEmail: v.string(),
    targetType: v.optional(v.string()),
    targetId: v.optional(v.string()),
    targetName: v.optional(v.string()),
    details: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_actor", ["actorId"])
    .index("by_action", ["action"])
    .index("by_target", ["targetType", "targetId"]),
});

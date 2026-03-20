import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table — synced from Clerk, with role assignment
  users: defineTable({
    clerkId: v.string(),        // Clerk user ID
    email: v.string(),
    name: v.string(),
    role: v.string(),           // "it_admin" | "user" | "approver" | "viewer"
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  // Diagrams table — stores the full diagram data
  diagrams: defineTable({
    name: v.string(),
    ownerId: v.string(),         // Clerk user ID of creator
    ownerName: v.string(),       // Display name
    blocks: v.string(),          // JSON stringified blocks array
    arrowAnnotations: v.string(),// JSON stringified annotations
    settings: v.string(),        // JSON stringified settings (preparedBy, checkedBy)
    status: v.string(),          // "draft" | "submitted" | "approved" | "rejected"
    approvedBy: v.optional(v.string()),   // Clerk user ID of approver
    approvedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_status", ["status"])
    .index("by_updated", ["updatedAt"]),
});

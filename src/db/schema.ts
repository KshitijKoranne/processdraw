import { pgTable, text, boolean, integer, bigint, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  clerkId: text("clerk_id").notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  imageUrl: text("image_url"),
  disabled: boolean("disabled").notNull().default(false),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
}, (table) => [
  uniqueIndex("users_clerk_id_idx").on(table.clerkId),
  index("users_role_idx").on(table.role),
]);

export const diagrams = pgTable("diagrams", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: text("owner_id").notNull(),
  ownerName: text("owner_name").notNull(),
  blocks: jsonb("blocks").$type<any[]>().notNull().default([]),
  arrowAnnotations: jsonb("arrow_annotations").$type<Record<string, any>>().notNull().default({}),
  settings: jsonb("settings").$type<Record<string, any>>().notNull().default({}),
  status: text("status").notNull().default("draft"),
  currentRevision: integer("current_revision"),
  finalized: boolean("finalized").notNull().default(false),
  finalizedBy: text("finalized_by"),
  finalizedByName: text("finalized_by_name"),
  finalizedAt: bigint("finalized_at", { mode: "number" }),
  approvedBy: text("approved_by"),
  approvedByName: text("approved_by_name"),
  approvedAt: bigint("approved_at", { mode: "number" }),
  rejectedBy: text("rejected_by"),
  rejectedByName: text("rejected_by_name"),
  rejectionComment: text("rejection_comment"),
  rejectedAt: bigint("rejected_at", { mode: "number" }),
  revertedBy: text("reverted_by"),
  revertedByName: text("reverted_by_name"),
  revertComment: text("revert_comment"),
  revertedAt: bigint("reverted_at", { mode: "number" }),
  revisionCount: integer("revision_count").notNull().default(0),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
}, (table) => [
  index("diagrams_owner_idx").on(table.ownerId),
  index("diagrams_status_idx").on(table.status),
]);

export const diagramVersions = pgTable("diagram_versions", {
  id: text("id").primaryKey(),
  diagramId: text("diagram_id").notNull(),
  revisionNumber: integer("revision_number").notNull(),
  name: text("name").notNull(),
  blocks: jsonb("blocks").$type<any[]>().notNull().default([]),
  arrowAnnotations: jsonb("arrow_annotations").$type<Record<string, any>>().notNull().default({}),
  settings: jsonb("settings").$type<Record<string, any>>().notNull().default({}),
  statusAtSnapshot: text("status_at_snapshot").notNull(),
  snapshotType: text("snapshot_type").notNull(),
  submittedBy: text("submitted_by").notNull(),
  submittedByName: text("submitted_by_name").notNull(),
  submittedAt: bigint("submitted_at", { mode: "number" }).notNull(),
  submittedRemarks: text("submitted_remarks").notNull(),
  approvedBy: text("approved_by"),
  approvedByName: text("approved_by_name"),
  approvedAt: bigint("approved_at", { mode: "number" }),
  approvalRemarks: text("approval_remarks"),
  revertedBy: text("reverted_by"),
  revertedByName: text("reverted_by_name"),
  revertedAt: bigint("reverted_at", { mode: "number" }),
  revertRemarks: text("revert_remarks"),
  rejectedBy: text("rejected_by"),
  rejectedByName: text("rejected_by_name"),
  rejectedAt: bigint("rejected_at", { mode: "number" }),
  rejectionRemarks: text("rejection_remarks"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
}, (table) => [
  index("versions_diagram_idx").on(table.diagramId),
]);

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  diagramId: text("diagram_id").notNull(),
  diagramName: text("diagram_name").notNull(),
  actorName: text("actor_name").notNull(),
  comment: text("comment"),
  read: boolean("read").notNull().default(false),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
}, (table) => [
  index("notifications_user_idx").on(table.userId),
  index("notifications_user_read_idx").on(table.userId, table.read),
]);

export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),
  action: text("action").notNull(),
  actorId: text("actor_id").notNull(),
  actorName: text("actor_name").notNull(),
  actorEmail: text("actor_email").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  targetName: text("target_name"),
  details: text("details"),
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
}, (table) => [
  index("audit_timestamp_idx").on(table.timestamp),
  index("audit_actor_idx").on(table.actorId),
  index("audit_target_idx").on(table.targetType, table.targetId),
]);

export type DbUser = typeof users.$inferSelect;
export type DbDiagram = typeof diagrams.$inferSelect;
export type DbDiagramVersion = typeof diagramVersions.$inferSelect;
export type DbNotification = typeof notifications.$inferSelect;

CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"actor_id" text NOT NULL,
	"actor_name" text NOT NULL,
	"actor_email" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"target_name" text,
	"details" text,
	"timestamp" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diagram_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"diagram_id" text NOT NULL,
	"revision_number" integer NOT NULL,
	"name" text NOT NULL,
	"blocks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"arrow_annotations" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status_at_snapshot" text NOT NULL,
	"snapshot_type" text NOT NULL,
	"submitted_by" text NOT NULL,
	"submitted_by_name" text NOT NULL,
	"submitted_at" bigint NOT NULL,
	"submitted_remarks" text NOT NULL,
	"approved_by" text,
	"approved_by_name" text,
	"approved_at" bigint,
	"approval_remarks" text,
	"reverted_by" text,
	"reverted_by_name" text,
	"reverted_at" bigint,
	"revert_remarks" text,
	"rejected_by" text,
	"rejected_by_name" text,
	"rejected_at" bigint,
	"rejection_remarks" text,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diagrams" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"owner_id" text NOT NULL,
	"owner_name" text NOT NULL,
	"blocks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"arrow_annotations" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"current_revision" integer,
	"finalized" boolean DEFAULT false NOT NULL,
	"finalized_by" text,
	"finalized_by_name" text,
	"finalized_at" bigint,
	"approved_by" text,
	"approved_by_name" text,
	"approved_at" bigint,
	"rejected_by" text,
	"rejected_by_name" text,
	"rejection_comment" text,
	"rejected_at" bigint,
	"reverted_by" text,
	"reverted_by_name" text,
	"revert_comment" text,
	"reverted_at" bigint,
	"revision_count" integer DEFAULT 0 NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"diagram_id" text NOT NULL,
	"diagram_name" text NOT NULL,
	"actor_name" text NOT NULL,
	"comment" text,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"password_hash" text NOT NULL,
	"must_change_password" boolean DEFAULT false NOT NULL,
	"image_url" text,
	"disabled" boolean DEFAULT false NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE INDEX "audit_timestamp_idx" ON "audit_log" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "audit_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_target_idx" ON "audit_log" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "versions_diagram_idx" ON "diagram_versions" USING btree ("diagram_id");--> statement-breakpoint
CREATE INDEX "diagrams_owner_idx" ON "diagrams" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "diagrams_status_idx" ON "diagrams" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_user_read_idx" ON "notifications" USING btree ("user_id","read");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");
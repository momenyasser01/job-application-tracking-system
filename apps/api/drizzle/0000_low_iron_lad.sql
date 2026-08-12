CREATE TYPE "public"."application_status" AS ENUM('saved', 'applied', 'interviewing', 'offer', 'rejected');--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company" text NOT NULL,
	"role" text NOT NULL,
	"status" "application_status" DEFAULT 'saved' NOT NULL,
	"location" text,
	"url" text,
	"applied_at" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "applications_status_idx" ON "applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "applications_created_at_idx" ON "applications" USING btree ("created_at" DESC NULLS LAST);
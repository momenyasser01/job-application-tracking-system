-- Rows written before applications had an owner cannot satisfy user_id NOT NULL
-- and there is nothing to backfill them with, so they go. This only ever runs
-- against a database that predates user scoping.
DELETE FROM "applications";--> statement-breakpoint
CREATE TYPE "public"."application_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."application_source" AS ENUM('job-board', 'company-site', 'referral', 'recruiter', 'other');--> statement-breakpoint
CREATE TYPE "public"."employment_type" AS ENUM('full-time', 'part-time', 'contract', 'internship');--> statement-breakpoint
CREATE TYPE "public"."salary_period" AS ENUM('hourly', 'monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."work_model" AS ENUM('on-site', 'hybrid', 'remote');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
-- Postgres cannot remove a value from an enum, so dropping 'saved' means
-- swapping the whole type. Dropping the default first is required: while it
-- stands, it depends on the old type and blocks the rename.
ALTER TABLE "applications" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TYPE "public"."application_status" RENAME TO "application_status_old";--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('applied', 'interviewing', 'offer', 'rejected', 'withdrawn');--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "status" SET DATA TYPE "public"."application_status" USING "status"::text::"public"."application_status";--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "status" SET DEFAULT 'applied';--> statement-breakpoint
DROP TYPE "public"."application_status_old";--> statement-breakpoint
ALTER TABLE "applications" RENAME COLUMN "role" TO "job_title";--> statement-breakpoint
ALTER TABLE "applications" RENAME COLUMN "url" TO "job_url";--> statement-breakpoint
DROP INDEX "applications_status_idx";--> statement-breakpoint
DROP INDEX "applications_created_at_idx";--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "employment_type" "public"."employment_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "work_model" "public"."work_model" NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "salary_min" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "salary_max" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "salary_currency" char(3);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "salary_period" "public"."salary_period";--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "priority" "public"."application_priority" DEFAULT 'medium' NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "source" "public"."application_source";--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "responsibilities" text NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "qualifications" text NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "job_description" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "recruiter_name" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "recruiter_email" text;--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "location" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "job_url" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "applied_at" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "applied_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "applications_user_id_applied_at_idx" ON "applications" USING btree ("user_id","applied_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "applications_user_id_status_idx" ON "applications" USING btree ("user_id","status");--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_salary_min_positive_check" CHECK ("applications"."salary_min" >= 0);--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_salary_range_check" CHECK ("applications"."salary_max" >= "applications"."salary_min");--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_salary_meta_check" CHECK (num_nonnulls("applications"."salary_min", "applications"."salary_max") = 0 or num_nonnulls("applications"."salary_currency", "applications"."salary_period") = 2);--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_salary_currency_check" CHECK ("applications"."salary_currency" ~ '^[A-Z]{3}$');

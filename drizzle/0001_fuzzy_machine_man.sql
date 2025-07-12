ALTER TABLE "student" RENAME COLUMN "matriNo" TO "matricNo";--> statement-breakpoint
ALTER TABLE "student" DROP CONSTRAINT "student_matriNo_unique";--> statement-breakpoint
ALTER TABLE "student" ADD CONSTRAINT "student_matricNo_unique" UNIQUE("matricNo");
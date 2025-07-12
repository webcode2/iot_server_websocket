CREATE TABLE "book" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"author" varchar(255) NOT NULL,
	"year" integer NOT NULL,
	"genre" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"liberianId" uuid
);
--> statement-breakpoint
ALTER TABLE "book" ADD CONSTRAINT "book_liberianId_users_id_fk" FOREIGN KEY ("liberianId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
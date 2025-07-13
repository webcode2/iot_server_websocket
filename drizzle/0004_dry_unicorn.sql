CREATE TABLE "borrow" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bookId" uuid NOT NULL,
	"borrowerId" uuid NOT NULL,
	"borrowedOn" timestamp with time zone DEFAULT now() NOT NULL,
	"returnedOn" timestamp with time zone DEFAULT null
);
--> statement-breakpoint
ALTER TABLE "borrow" ADD CONSTRAINT "borrow_bookId_book_id_fk" FOREIGN KEY ("bookId") REFERENCES "public"."book"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "borrow" ADD CONSTRAINT "borrow_borrowerId_student_id_fk" FOREIGN KEY ("borrowerId") REFERENCES "public"."student"("id") ON DELETE cascade ON UPDATE no action;
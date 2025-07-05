CREATE TABLE "attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"time" timestamp DEFAULT now() NOT NULL,
	"methodUsed" varchar(20),
	"studentId" uuid
);
--> statement-breakpoint
CREATE TABLE "developer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"password_reset_token" varchar(25),
	CONSTRAINT "developer_id_unique" UNIQUE("id"),
	CONSTRAINT "developer_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "iot_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"developer_id" uuid,
	"name" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "iot_devices_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "nBmessage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"time" timestamp DEFAULT now() NOT NULL,
	"message" varchar(500) NOT NULL,
	"isActive" boolean DEFAULT true,
	"duration" integer DEFAULT 2,
	"developerId" uuid,
	"staffId" uuid DEFAULT null
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"developer_id" uuid NOT NULL,
	CONSTRAINT "users_id_unique" UNIQUE("id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firstName" varchar(100),
	"lastNname" varchar(100),
	"matriNo" varchar(20),
	"email" varchar(255),
	"fingerPrintId" varchar(255),
	"rfid" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "students_id_unique" UNIQUE("id"),
	CONSTRAINT "students_matriNo_unique" UNIQUE("matriNo"),
	CONSTRAINT "students_email_unique" UNIQUE("email"),
	CONSTRAINT "students_fingerPrintId_unique" UNIQUE("fingerPrintId"),
	CONSTRAINT "students_rfid_unique" UNIQUE("rfid")
);
--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_studentId_students_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iot_devices" ADD CONSTRAINT "iot_devices_developer_id_developer_id_fk" FOREIGN KEY ("developer_id") REFERENCES "public"."developer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nBmessage" ADD CONSTRAINT "nBmessage_developerId_developer_id_fk" FOREIGN KEY ("developerId") REFERENCES "public"."developer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nBmessage" ADD CONSTRAINT "nBmessage_staffId_users_id_fk" FOREIGN KEY ("staffId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_developer_id_developer_id_fk" FOREIGN KEY ("developer_id") REFERENCES "public"."developer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fingerPrintId_idx" ON "students" USING btree ("fingerPrintId");--> statement-breakpoint
CREATE INDEX "rfid_idx" ON "students" USING btree ("rfid");
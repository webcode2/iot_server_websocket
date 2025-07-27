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
CREATE TABLE "staffs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"developer_id" uuid NOT NULL,
	CONSTRAINT "staffs_id_unique" UNIQUE("id"),
	CONSTRAINT "staffs_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "iot_devices" ADD CONSTRAINT "iot_devices_developer_id_developer_id_fk" FOREIGN KEY ("developer_id") REFERENCES "public"."developer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nBmessage" ADD CONSTRAINT "nBmessage_developerId_developer_id_fk" FOREIGN KEY ("developerId") REFERENCES "public"."developer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nBmessage" ADD CONSTRAINT "nBmessage_staffId_staffs_id_fk" FOREIGN KEY ("staffId") REFERENCES "public"."staffs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staffs" ADD CONSTRAINT "staffs_developer_id_developer_id_fk" FOREIGN KEY ("developer_id") REFERENCES "public"."developer"("id") ON DELETE no action ON UPDATE no action;
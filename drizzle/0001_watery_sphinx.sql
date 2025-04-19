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
ALTER TABLE "iot_devices" DROP CONSTRAINT "iot_devices_email_unique";--> statement-breakpoint
ALTER TABLE "iot_devices" ADD COLUMN "developer_id" uuid;--> statement-breakpoint
ALTER TABLE "iot_devices" ADD CONSTRAINT "iot_devices_developer_id_developer_id_fk" FOREIGN KEY ("developer_id") REFERENCES "public"."developer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iot_devices" DROP COLUMN "email";--> statement-breakpoint
ALTER TABLE "iot_devices" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "iot_devices" ADD CONSTRAINT "iot_devices_id_unique" UNIQUE("id");
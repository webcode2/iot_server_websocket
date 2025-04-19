CREATE TABLE "iot_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "iot_devices_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "iot_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid,
	"log_data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "iot_data" ADD CONSTRAINT "iot_data_app_id_iot_devices_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."iot_devices"("id") ON DELETE no action ON UPDATE no action;
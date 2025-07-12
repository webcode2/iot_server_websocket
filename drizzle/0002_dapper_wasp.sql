ALTER TABLE "attendance" DROP CONSTRAINT "attendance_studentId_student_id_fk";
--> statement-breakpoint
ALTER TABLE "iot_devices" DROP CONSTRAINT "iot_devices_developer_id_developer_id_fk";
--> statement-breakpoint
ALTER TABLE "nBmessage" DROP CONSTRAINT "nBmessage_staffId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_studentId_student_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."student"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iot_devices" ADD CONSTRAINT "iot_devices_developer_id_developer_id_fk" FOREIGN KEY ("developer_id") REFERENCES "public"."developer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nBmessage" ADD CONSTRAINT "nBmessage_staffId_users_id_fk" FOREIGN KEY ("staffId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
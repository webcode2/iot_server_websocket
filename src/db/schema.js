import { pgTable, uuid, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { index } from 'drizzle-orm/pg-core';
import { boolean, integer, text } from "drizzle-orm/gel-core";

// IoT Devices Table
const iotDevices = pgTable('iot_devices', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`).unique(), // PostgreSQL's built-in UUID
  developerId: uuid('developer_id').references(() => developer.id, {
    onDelete: 'cascade'
  }),
  name: varchar('name', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});


const developer = pgTable('developer', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`).unique(), // PostgreSQL's built-in UUID
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  passwordResetToken: varchar('password_reset_token', { length: 25 }),
});

const staff = pgTable("staffs", {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`).unique(), // PostgreSQL's built-in UUID
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  developerId: uuid('developer_id').references(() => developer.id).notNull(),

})



const Message = pgTable(
  "nBmessage", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  time: timestamp('time').defaultNow().notNull(),
  message: varchar("message", { length: 500 }).notNull(),
  isActive: boolean("isActive").default(true),
  duration: integer("duration").default(2),
    developerId: uuid("developerId").references(() => developer.id,),
    staff_id: uuid("staffId").references(() => staff.id, {
      onDelete: 'cascade'
    }).default(null)
});




export {
  iotDevices,
  developer,
  staff,
  Message
};
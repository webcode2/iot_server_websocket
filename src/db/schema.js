import { pgTable, uuid, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { index } from 'drizzle-orm/pg-core';
import { boolean, integer } from "drizzle-orm/gel-core";



const developer = pgTable('developer', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`).unique(), // PostgreSQL's built-in UUID
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  passwordResetToken: varchar('password_reset_token', { length: 25 }),
});

const staff = pgTable("users", {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`).unique(), // PostgreSQL's built-in UUID
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  developerId: uuid('developer_id').references(() => developer.id).notNull(),

})




// IoT Devices Table
const iotDevices = pgTable('iot_devices', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`).unique(), // PostgreSQL's built-in UUID
  developerId: uuid('developer_id').references(() => developer.id),
  name: varchar('name', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});



// Jack library
const student = pgTable('students', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`).unique(), // PostgreSQL's built-in UUID
  firstName: varchar('firstName', { length: 100 }),
  lastName: varchar('lastName', { length: 100 }),
  matriNo: varchar('matriNo', { length: 20 }).unique(),
  email: varchar('email', { length: 255 }).unique(),
  fingerPrintId: varchar('fingerPrintId', { length: 255 }).unique(),
  rfid: varchar('rfid', { length: 100 }).unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}
  , (table) => ([
    index("fingerPrintId_idx").on(table.fingerPrintId),
    index("rfid_idx").on(table.rfid),
  ])
);

const attendance = pgTable(
  "attendance", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  time: timestamp('time').defaultNow().notNull(),
  methodUsed: varchar('methodUsed', { length: 20 }),
  studentId: uuid('studentId').references(() => student.id),

}
);






// Tope's Notice Boar
const nBMessage = pgTable(
  "nBmessage", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  time: timestamp('time').defaultNow().notNull(),
  message: varchar("message", { length: 500 }).notNull(),
  isActive: boolean("isActive").default(true),
  duration: integer("duration").default(2),
    develouserperId: uuid("developerId").references(() => developer.id),
    staff_id: uuid("staffId").references(() => staff.id).default(null)
});




export {
  iotDevices,
  developer,
  staff,
  student,
  attendance,

  nBMessage
};
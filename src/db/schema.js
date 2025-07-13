import { pgTable, uuid, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { index } from 'drizzle-orm/pg-core';
import { boolean, integer, text } from "drizzle-orm/gel-core";



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
  developerId: uuid('developer_id').references(() => developer.id, {
    onDelete: 'cascade'
  }),
  name: varchar('name', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});



// Jack library
const student = pgTable('student', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`).unique(), // PostgreSQL's built-in UUID
  firstName: varchar('firstName', { length: 100 }),
  lastName: varchar('lastName', { length: 100 }),
  matricNo: varchar('matricNo', { length: 20 }).unique(),
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
    studentId: uuid('studentId').references(() => student.id, {
      onDelete: 'cascade'
    }),

}
);


export const book = pgTable("book", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  year: integer("year").notNull(),
  genre: varchar("genre", { length: 100 }).notNull(),
  description: text("description").notNull(),
  liberianId: uuid('liberianId').references(() => staff.id, {
    onDelete: 'cascade'
  }),
});


export const borrow = pgTable("borrow", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  bookId: uuid("bookId").notNull().references(() => book.id, { onDelete: "cascade" }),
  borrowerId: uuid("borrowerId").notNull().references(() => student.id, { onDelete: "cascade" }),
  borrowedOn: timestamp("borrowedOn", { withTimezone: true }).defaultNow().notNull(),
  returnedOn: timestamp("returnedOn", { withTimezone: true }).default(null),
});


// Tope's Notice Boar
const nBMessage = pgTable(
  "nBmessage", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  time: timestamp('time').defaultNow().notNull(),
  message: varchar("message", { length: 500 }).notNull(),
  isActive: boolean("isActive").default(true),
  duration: integer("duration").default(2),
    develouserperId: uuid("developerId").references(() => developer.id,),
    staff_id: uuid("staffId").references(() => staff.id, {
      onDelete: 'cascade'
    }).default(null)
});




export {
  iotDevices,
  developer,
  staff,
  student,
  attendance,

  nBMessage
};
const { pgTable, uuid, varchar, jsonb, timestamp } = require('drizzle-orm/pg-core');
const { sql } = require('drizzle-orm');

const developer=pgTable('developer', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`).unique(), // PostgreSQL's built-in UUID
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  passwordResetToken: varchar('password_reset_token', { length: 25 }),
});

// IoT Devices Table
const iotDevices = pgTable('iot_devices', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`).unique(), // PostgreSQL's built-in UUID
  developerId: uuid('developer_id').references(() => developer.id),
  name: varchar('name', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});



// IoT Data Table
const iotData = pgTable('iot_data', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`), // PostgreSQL's built-in UUID
  appId: uuid('app_id').references(() => iotDevices.id),
  logData: jsonb('log_data').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

module.exports = {
  iotDevices,
  iotData,developer
};
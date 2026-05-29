import { pgTable, serial, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const trends = pgTable('trends', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  signification: text('signification').notNull(),
  context: text('context').notNull(),
  usageKeys: jsonb('usage_keys').notNull().$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

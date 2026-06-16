import { pgTable, text, timestamp, jsonb, uuid, integer } from 'drizzle-orm/pg-core';

export const trends = pgTable('trends', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  slug: text('slug').unique().notNull(),
  description: text('description').notNull(),
  context: text('context').notNull(),
  usage_example: text('usage_example').notNull(),
  usage_keys: jsonb('usage_keys').$type<string[]>(),
  score_base: integer('score_base').default(0).notNull(),
  status: text('status').notNull(), // Assuming text for simplicity, or we could use pgEnum
  category: text('category'),
  region: text('region'),
  age_range: text('age_range'),
  image_url: text('image_url'),
  platforms: jsonb('platforms'),
  badges: jsonb('badges'),
  extra_stats: jsonb('extra_stats'),
  rank: integer('rank'),
  weakSignalsHashtags: jsonb('weak_signals_hashtags'),
  weakSignalsMusic: jsonb('weak_signals_music'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

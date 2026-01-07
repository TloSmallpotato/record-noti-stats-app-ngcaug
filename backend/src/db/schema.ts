import { pgTable, text, timestamp, uuid, integer } from 'drizzle-orm/pg-core';

export const recordings = pgTable('recordings', {
  id: uuid('id').primaryKey().defaultRandom(),
  video_url: text('video_url').notNull(),
  thumbnail_url: text('thumbnail_url'),
  duration: integer('duration').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  file_size: integer('file_size').notNull(),
});

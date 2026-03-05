import { sqliteTable, integer, text, primaryKey } from 'drizzle-orm/sqlite-core';

export const poems = sqliteTable('poems', {
  id: integer('id').primaryKey(),
  title: text('title').notNull().default('Untitled'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const versions = sqliteTable('versions', {
  id: integer('id').primaryKey(),
  poemId: integer('poem_id').notNull(),
  content: text('content').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey(),
  poemId: integer('poem_id').notNull(),
  label: text('label').notNull(),
});

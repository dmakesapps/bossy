import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Projects (like Claude's Projects)
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

// Agents / Personas
export const agents = sqliteTable('agents', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  systemPrompt: text('system_prompt').notNull(),
  model: text('model').default('anthropic/claude-sonnet-4-20250514'),
  temperature: real('temperature').default(0.7),
  color: text('color').notNull(),
  toolsEnabled: text('tools_enabled').default('["rag_search","web_search"]'),
  actionsEnabled: text('actions_enabled').default('["chat","report","deep_think"]'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

// Conversations
export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  agentId: text('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  title: text('title').default('New Conversation'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

// Messages
export const messages = sqliteTable('messages', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  conversationId: text('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['user', 'assistant', 'system', 'tool'] }).notNull(),
  content: text('content').notNull(),
  toolCalls: text('tool_calls'), // JSON string
  toolResults: text('tool_results'), // JSON string
  metadata: text('metadata'), // JSON string
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

// Documents (metadata only — vectors live in Qdrant)
export const documents = sqliteTable('documents', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: integer('file_size').notNull(),
  chunkCount: integer('chunk_count').default(0),
  status: text('status', { enum: ['pending', 'processing', 'ready', 'error'] }).default('pending'),
  errorMessage: text('error_message'),
  qdrantCollection: text('qdrant_collection'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  processedAt: text('processed_at'),
});

// Helper function to generate IDs (using nanoid)
function generateId(): string {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// Type exports for use in the application
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

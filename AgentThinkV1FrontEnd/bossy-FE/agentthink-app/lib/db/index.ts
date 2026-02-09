import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

// Get database path from environment variable or use default
const databasePath = process.env.DATABASE_URL || './data/agentthink.db';

// Ensure the data directory exists
const dir = dirname(databasePath);
if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
}

// Create the SQLite connection
const sqlite = new Database(databasePath);

// Enable foreign keys
sqlite.pragma('foreign_keys = ON');

// Create the Drizzle database instance
export const db = drizzle(sqlite, { schema });

// Export the raw sqlite connection for migrations
export { sqlite };

/**
 * Offline Database (SQLite)
 *
 * Provides offline-first data storage and sync capabilities.
 * Uses expo-sqlite for local persistence.
 */

import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'agentic-creator-os.db';

let db: SQLite.SQLiteDatabase | null = null;

// ============================================
// DATABASE INITIALIZATION
// ============================================

export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync(DATABASE_NAME);

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    -- Messages queue for offline sending
    CREATE TABLE IF NOT EXISTS message_queue (
      id TEXT PRIMARY KEY,
      conversation_id TEXT,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0,
      sync_error TEXT
    );

    -- Cached conversations
    CREATE TABLE IF NOT EXISTS cached_conversations (
      id TEXT PRIMARY KEY,
      title TEXT,
      summary TEXT,
      last_message_at TEXT,
      message_count INTEGER DEFAULT 0,
      is_archived INTEGER DEFAULT 0,
      updated_at TEXT
    );

    -- Cached messages
    CREATE TABLE IF NOT EXISTS cached_messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      tool_calls TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (conversation_id) REFERENCES cached_conversations(id)
    );

    -- Cached tasks
    CREATE TABLE IF NOT EXISTS cached_tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      priority INTEGER DEFAULT 5,
      due_date TEXT,
      completed_at TEXT,
      category TEXT,
      tags TEXT,
      updated_at TEXT,
      synced INTEGER DEFAULT 1
    );

    -- Cached content ideas
    CREATE TABLE IF NOT EXISTS cached_ideas (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      source TEXT,
      format TEXT DEFAULT 'long_form',
      status TEXT DEFAULT 'new',
      tags TEXT,
      potential_impact REAL,
      updated_at TEXT,
      synced INTEGER DEFAULT 1
    );

    -- Cached creator memory
    CREATE TABLE IF NOT EXISTS cached_memory (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      category TEXT NOT NULL,
      confidence REAL DEFAULT 1.0,
      updated_at TEXT,
      synced INTEGER DEFAULT 1
    );

    -- Sync metadata
    CREATE TABLE IF NOT EXISTS sync_metadata (
      table_name TEXT PRIMARY KEY,
      last_synced_at TEXT,
      last_sync_status TEXT
    );

    -- Pending changes for sync
    CREATE TABLE IF NOT EXISTS pending_changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      data TEXT,
      created_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0,
      sync_error TEXT
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_message_queue_synced ON message_queue(synced);
    CREATE INDEX IF NOT EXISTS idx_cached_messages_conversation ON cached_messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_cached_tasks_status ON cached_tasks(status);
    CREATE INDEX IF NOT EXISTS idx_pending_changes_synced ON pending_changes(synced);
  `);
}

// ============================================
// MESSAGE QUEUE OPERATIONS
// ============================================

export interface QueuedMessage {
  id: string;
  conversationId: string | null;
  content: string;
  createdAt: string;
  synced: boolean;
  syncError: string | null;
}

export async function queueMessage(
  content: string,
  conversationId?: string
): Promise<string> {
  if (!db) throw new Error('Database not initialized');

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO message_queue (id, conversation_id, content, created_at)
     VALUES (?, ?, ?, ?)`,
    [id, conversationId || null, content, createdAt]
  );

  return id;
}

export async function getUnsentMessages(): Promise<QueuedMessage[]> {
  if (!db) throw new Error('Database not initialized');

  const result = await db.getAllAsync<any>(
    `SELECT * FROM message_queue WHERE synced = 0 ORDER BY created_at ASC`
  );

  return result.map(row => ({
    id: row.id,
    conversationId: row.conversation_id,
    content: row.content,
    createdAt: row.created_at,
    synced: row.synced === 1,
    syncError: row.sync_error,
  }));
}

export async function markMessageSynced(id: string): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync(
    `UPDATE message_queue SET synced = 1 WHERE id = ?`,
    [id]
  );
}

export async function markMessageSyncError(id: string, error: string): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync(
    `UPDATE message_queue SET sync_error = ? WHERE id = ?`,
    [error, id]
  );
}

// ============================================
// TASK CACHE OPERATIONS
// ============================================

export interface CachedTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: number;
  dueDate: string | null;
  completedAt: string | null;
  category: string | null;
  tags: string[];
  updatedAt: string;
  synced: boolean;
}

export async function cacheTasks(tasks: any[]): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  for (const task of tasks) {
    await db.runAsync(
      `INSERT OR REPLACE INTO cached_tasks
       (id, title, description, status, priority, due_date, completed_at, category, tags, updated_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        task.id,
        task.title,
        task.description,
        task.status,
        task.priority,
        task.due_date,
        task.completed_at,
        task.category,
        JSON.stringify(task.tags || []),
        task.updated_at || new Date().toISOString(),
      ]
    );
  }
}

export async function getCachedTasks(status?: string): Promise<CachedTask[]> {
  if (!db) throw new Error('Database not initialized');

  let query = `SELECT * FROM cached_tasks`;
  const params: any[] = [];

  if (status && status !== 'all') {
    query += ` WHERE status = ?`;
    params.push(status);
  }

  query += ` ORDER BY priority DESC, due_date ASC`;

  const result = await db.getAllAsync<any>(query, params);

  return result.map(row => ({
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    completedAt: row.completed_at,
    category: row.category,
    tags: JSON.parse(row.tags || '[]'),
    updatedAt: row.updated_at,
    synced: row.synced === 1,
  }));
}

export async function createTaskOffline(task: Omit<CachedTask, 'id' | 'synced' | 'updatedAt'>): Promise<string> {
  if (!db) throw new Error('Database not initialized');

  const id = crypto.randomUUID();
  const updatedAt = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO cached_tasks
     (id, title, description, status, priority, due_date, category, tags, updated_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      id,
      task.title,
      task.description,
      task.status,
      task.priority,
      task.dueDate,
      task.category,
      JSON.stringify(task.tags || []),
      updatedAt,
    ]
  );

  // Record pending change
  await recordPendingChange('tasks', id, 'INSERT', task);

  return id;
}

export async function updateTaskOffline(id: string, updates: Partial<CachedTask>): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  const fields: string[] = [];
  const values: any[] = [];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }
  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);
    if (updates.status === 'completed') {
      fields.push('completed_at = ?');
      values.push(new Date().toISOString());
    }
  }
  if (updates.priority !== undefined) {
    fields.push('priority = ?');
    values.push(updates.priority);
  }
  if (updates.dueDate !== undefined) {
    fields.push('due_date = ?');
    values.push(updates.dueDate);
  }

  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  fields.push('synced = 0');
  values.push(id);

  await db.runAsync(
    `UPDATE cached_tasks SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  // Record pending change
  await recordPendingChange('tasks', id, 'UPDATE', updates);
}

// ============================================
// MEMORY CACHE OPERATIONS
// ============================================

export async function cacheMemory(items: Array<{ key: string; value: string; category: string; confidence: number }>): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  for (const item of items) {
    await db.runAsync(
      `INSERT OR REPLACE INTO cached_memory (key, value, category, confidence, updated_at, synced)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [item.key, item.value, item.category, item.confidence, new Date().toISOString()]
    );
  }
}

export async function getCachedMemory(category?: string): Promise<Array<{ key: string; value: string; category: string; confidence: number }>> {
  if (!db) throw new Error('Database not initialized');

  let query = `SELECT * FROM cached_memory`;
  const params: any[] = [];

  if (category) {
    query += ` WHERE category = ?`;
    params.push(category);
  }

  query += ` ORDER BY confidence DESC`;

  const result = await db.getAllAsync<any>(query, params);

  return result.map(row => ({
    key: row.key,
    value: row.value,
    category: row.category,
    confidence: row.confidence,
  }));
}

// ============================================
// SYNC OPERATIONS
// ============================================

async function recordPendingChange(
  tableName: string,
  recordId: string,
  operation: string,
  data: any
): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync(
    `INSERT INTO pending_changes (table_name, record_id, operation, data, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [tableName, recordId, operation, JSON.stringify(data), new Date().toISOString()]
  );
}

export interface PendingChange {
  id: number;
  tableName: string;
  recordId: string;
  operation: string;
  data: any;
  createdAt: string;
}

export async function getPendingChanges(): Promise<PendingChange[]> {
  if (!db) throw new Error('Database not initialized');

  const result = await db.getAllAsync<any>(
    `SELECT * FROM pending_changes WHERE synced = 0 ORDER BY created_at ASC`
  );

  return result.map(row => ({
    id: row.id,
    tableName: row.table_name,
    recordId: row.record_id,
    operation: row.operation,
    data: JSON.parse(row.data || '{}'),
    createdAt: row.created_at,
  }));
}

export async function markChangeSynced(id: number): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync(
    `UPDATE pending_changes SET synced = 1 WHERE id = ?`,
    [id]
  );
}

export async function getLastSyncTime(tableName: string): Promise<string | null> {
  if (!db) throw new Error('Database not initialized');

  const result = await db.getFirstAsync<any>(
    `SELECT last_synced_at FROM sync_metadata WHERE table_name = ?`,
    [tableName]
  );

  return result?.last_synced_at || null;
}

export async function updateSyncMetadata(tableName: string, status: string): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync(
    `INSERT OR REPLACE INTO sync_metadata (table_name, last_synced_at, last_sync_status)
     VALUES (?, ?, ?)`,
    [tableName, new Date().toISOString(), status]
  );
}

// ============================================
// CLEANUP
// ============================================

export async function clearSyncedMessages(olderThanDays: number = 7): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);

  await db.runAsync(
    `DELETE FROM message_queue WHERE synced = 1 AND created_at < ?`,
    [cutoff.toISOString()]
  );

  await db.runAsync(
    `DELETE FROM pending_changes WHERE synced = 1 AND created_at < ?`,
    [cutoff.toISOString()]
  );
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

export default {
  initDatabase,
  queueMessage,
  getUnsentMessages,
  markMessageSynced,
  cacheTasks,
  getCachedTasks,
  createTaskOffline,
  updateTaskOffline,
  cacheMemory,
  getCachedMemory,
  getPendingChanges,
  markChangeSynced,
  getLastSyncTime,
  updateSyncMetadata,
  clearSyncedMessages,
  closeDatabase,
};

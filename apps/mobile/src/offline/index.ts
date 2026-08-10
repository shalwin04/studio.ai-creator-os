/**
 * Offline Module
 *
 * Exports all offline database and sync utilities.
 */

export {
  initDatabase,
  queueMessage,
  getUnsentMessages,
  markMessageSynced,
  markMessageSyncError,
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
} from './database';

export type {
  QueuedMessage,
  CachedTask,
  PendingChange,
} from './database';

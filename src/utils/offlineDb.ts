import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { syncApi, SyncOperation } from '../api/syncApi';
import { Task } from '../types';
import toast from 'react-hot-toast';

interface TodoAppDB extends DBSchema {
  tasks: {
    key: string;
    value: Task;
  };
  sync_queue: {
    key: string;
    value: SyncOperation;
  };
}

let dbPromise: Promise<IDBPDatabase<TodoAppDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<TodoAppDB>('mscit_todo_client_db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('tasks')) {
          db.createObjectStore('tasks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export const offlineDb = {
  // Cache tasks
  cacheTasks: async (tasks: Task[]) => {
    try {
      const db = await getDB();
      const tx = db.transaction('tasks', 'readwrite');
      for (const t of tasks) {
        await tx.store.put(t);
      }
      await tx.done;
    } catch (err) {
      console.warn('Failed to cache tasks in IndexedDB:', err);
    }
  },

  getCachedTasks: async (): Promise<Task[]> => {
    try {
      const db = await getDB();
      return await db.getAll('tasks');
    } catch {
      return [];
    }
  },

  // Offline queue
  enqueueOperation: async (op: SyncOperation) => {
    try {
      const db = await getDB();
      await db.put('sync_queue', op);
    } catch (err) {
      console.warn('Failed to enqueue offline operation:', err);
    }
  },

  flushSyncQueue: async () => {
    try {
      const db = await getDB();
      const ops = await db.getAll('sync_queue');
      if (ops.length === 0) return;

      const res = await syncApi.bulkSync(ops);
      if (res.processed > 0) {
        // Clear synced items
        const tx = db.transaction('sync_queue', 'readwrite');
        await tx.store.clear();
        await tx.done;
        toast.success(`Synced ${res.processed} offline changes! 🔄`);
      }
    } catch (err) {
      console.warn('Offline sync flush failed:', err);
    }
  },
};

// Listen to online events to automatically sync
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    offlineDb.flushSyncQueue();
  });
}

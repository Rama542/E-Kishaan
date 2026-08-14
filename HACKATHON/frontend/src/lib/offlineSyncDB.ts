/**
 * Native IndexedDB Offline Sync Queue Engine
 * ===========================================
 * Stores offline transactions in browser IndexedDB ('E-Kishaan-OfflineDB')
 * and flushes them automatically via POST /api/offline/sync-queue when online.
 */

const DB_NAME = 'E-Kishaan-OfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'sync_queue';

export interface OfflineSyncRecord {
  id: string;
  action: string;
  timestamp: string;
  payload: Record<string, unknown>;
  synced: boolean;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('synced', 'synced', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function enqueueOfflineAction(action: string, payload: Record<string, unknown>): Promise<OfflineSyncRecord> {
  const db = await openDatabase();
  const record: OfflineSyncRecord = {
    id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    action,
    timestamp: new Date().toISOString(),
    payload,
    synced: false,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.add(record);

    request.onsuccess = () => resolve(record);
    request.onerror = () => reject(request.error);
  });
}

export async function getUnsyncedQueueRecords(): Promise<OfflineSyncRecord[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const items: OfflineSyncRecord[] = request.result || [];
        resolve(items.filter((item) => !item.synced));
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

export async function clearSyncedRecords(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    let completed = 0;

    for (const id of ids) {
      const req = store.delete(id);
      req.onsuccess = () => {
        completed++;
        if (completed === ids.length) resolve();
      };
      req.onerror = () => reject(req.error);
    }
  });
}

export async function flushOfflineSyncQueue(backendBaseUrl = 'http://localhost:8000/api'): Promise<{ syncedCount: number }> {
  const records = await getUnsyncedQueueRecords();
  if (!records.length) return { syncedCount: 0 };

  try {
    const response = await fetch(`${backendBaseUrl}/offline/sync-queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_device_id: typeof window !== 'undefined' ? navigator.userAgent : 'device-web-1',
        synced_at: new Date().toISOString(),
        queue_items: records,
      }),
    });

    if (response.ok) {
      await clearSyncedRecords(records.map((r) => r.id));
      return { syncedCount: records.length };
    }
  } catch {
    // If backend endpoint is offline, preserve queue in IndexedDB
  }

  return { syncedCount: 0 };
}

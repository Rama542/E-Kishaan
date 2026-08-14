/**
 * Offline-First IndexedDB Sync Engine for E-Kisaan Farm Journal
 * =============================================================
 * Handles queueing transactions locally when offline and automatically
 * flushing to `POST /journal/entry` when network connection is restored.
 */

export interface OfflineJournalEntry {
  entry_id: string;
  farm_id: string;
  entry_date: string;
  crop_name: string;
  activity_type: string;
  description: string;
  debit_account: string;
  credit_account: string;
  amount_inr: number;
  inputs_used?: Array<{ item_name: string; quantity: number; unit: string; unit_price_inr: number }>;
  labor_hours?: number;
  proof_image_url?: string | null;
  is_synced_offline: boolean;
  timestamp: number;
}

const DB_NAME = 'farm_journal_db';
const DB_VERSION = 1;
const STORE_NAME = 'journal_queue';

let dbInstance: IDBDatabase | null = null;

export async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('❌ Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      console.log('✅ IndexedDB farm_journal_db initialized');
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'entry_id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        console.log('📦 Created IndexedDB store:', STORE_NAME);
      }
    };
  });
}

export async function saveOfflineEntry(entry: OfflineJournalEntry): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(entry);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getQueuedEntries(): Promise<OfflineJournalEntry[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function removeQueuedEntry(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function syncQueuedEntries(apiEndpoint = '/api/journal/entry'): Promise<{ synced: number; failed: number }> {
  if (!navigator.onLine) {
    console.warn('⚠️ Device is offline. Skipping queue sync.');
    return { synced: 0, failed: 0 };
  }

  const queued = await getQueuedEntries();
  if (queued.length === 0) return { synced: 0, failed: 0 };

  console.log(`🔄 Attempting to sync ${queued.length} offline journal entries...`);

  let synced = 0;
  let failed = 0;

  for (const entry of queued) {
    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...entry, is_synced_offline: true }),
      });

      if (res.ok) {
        await removeQueuedEntry(entry.entry_id);
        synced++;
      } else {
        failed++;
      }
    } catch (err) {
      console.error(`❌ Sync failed for entry ${entry.entry_id}:`, err);
      failed++;
    }
  }

  console.log(`✅ Queue sync complete: ${synced} synced, ${failed} remaining.`);
  return { synced, failed };
}

// Auto-sync listener on window online event
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('🌐 Network online detected! Flushing IndexedDB journal queue...');
    syncQueuedEntries().catch((err) => console.error('Auto sync error:', err));
  });
}

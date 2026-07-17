/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const DB_NAME = 'ColegioReacaoOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'keyval-store';

class IndexedDBClass {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('[IndexedDB] Database failed to open:', event);
        reject(new Error('IndexedDB failed to open'));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
          console.log('[IndexedDB] Object store created successfully');
        }
      };
    });

    return this.dbPromise;
  }

  /**
   * Save an item in IndexedDB
   */
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(value, key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`[IndexedDB] Error saving key "${key}":`, error);
    }
  }

  /**
   * Get an item from IndexedDB
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => {
          resolve(request.result !== undefined ? request.result as T : null);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`[IndexedDB] Error loading key "${key}":`, error);
      return null;
    }
  }

  /**
   * Remove an item from IndexedDB
   */
  async removeItem(key: string): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`[IndexedDB] Error deleting key "${key}":`, error);
    }
  }

  /**
   * Clear the entire IndexedDB store
   */
  async clear(): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('[IndexedDB] Error clearing database:', error);
    }
  }
}

export const IndexedDBService = new IndexedDBClass();
export default IndexedDBService;

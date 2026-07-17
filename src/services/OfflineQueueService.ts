/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IndexedDBService } from './IndexedDBService';

export interface OfflineAction {
  id: string;
  timestamp: number;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  collection: string;
  dataId: string;
  payload: any;
}

type ConnectionCallback = (isOnline: boolean, isSyncing: boolean) => void;

class OfflineQueueClass {
  private queue: OfflineAction[] = [];
  private listeners: ConnectionCallback[] = [];
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;

  constructor() {
    // Listen to browser online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleConnectionChange(true));
      window.addEventListener('offline', () => this.handleConnectionChange(false));
      
      // Load any existing queue on startup
      this.loadQueue();
    }
  }

  private async loadQueue() {
    try {
      const savedQueue = await IndexedDBService.getItem<OfflineAction[]>('offline_action_queue');
      if (savedQueue) {
        this.queue = savedQueue;
        console.log(`[Offline Queue] Loaded ${this.queue.length} pending actions from IndexedDB.`);
        if (this.isOnline && this.queue.length > 0) {
          this.processQueue();
        }
      }
    } catch (error) {
      console.error('[Offline Queue] Error loading queue from IndexedDB:', error);
    }
  }

  private async saveQueue() {
    try {
      await IndexedDBService.setItem('offline_action_queue', this.queue);
    } catch (error) {
      console.error('[Offline Queue] Error saving queue to IndexedDB:', error);
    }
  }

  private handleConnectionChange(online: boolean) {
    if (this.isOnline === online) return;
    this.isOnline = online;
    console.log(`[Network Status] Connection changed. Online: ${online}`);
    
    // Notify all UI listeners
    this.notifyListeners();

    if (online) {
      // Automatically process queue when connection returns
      this.processQueue();
    }
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback(this.isOnline, this.isSyncing));
  }

  /**
   * Subscribe to connection and sync status changes
   */
  subscribe(callback: ConnectionCallback): () => void {
    this.listeners.push(callback);
    // Call immediately with current status
    callback(this.isOnline, this.isSyncing);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Check if online
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Check if syncing
   */
  getSyncingStatus(): boolean {
    return this.isSyncing;
  }

  /**
   * Add a new action to the offline queue
   */
  async enqueue(type: OfflineAction['type'], collection: string, dataId: string, payload: any) {
    // Avoid duplicate actions for same item if already in queue
    const id = `ACTION-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const action: OfflineAction = {
      id,
      timestamp: Date.now(),
      type,
      collection,
      dataId,
      payload
    };

    // Filter out previous redundant actions for the same ID to save network
    if (type === 'UPDATE' || type === 'DELETE') {
      this.queue = this.queue.filter(
        item => !(item.collection === collection && item.dataId === dataId && item.type === 'UPDATE')
      );
    }

    this.queue.push(action);
    await this.saveQueue();
    console.log(`[Offline Queue] Queued action: ${type} on ${collection} for ID ${dataId}. Queue length: ${this.queue.length}`);
    
    // If online, trigger sync
    if (this.isOnline) {
      this.processQueue();
    }
  }

  /**
   * Get all queued actions
   */
  getQueue(): OfflineAction[] {
    return this.queue;
  }

  /**
   * Process and sync the offline queue
   */
  async processQueue() {
    if (!this.isOnline || this.queue.length === 0 || this.isSyncing) return;

    this.isSyncing = true;
    this.notifyListeners();

    console.log(`[Offline Queue] Starting sync of ${this.queue.length} pending operations...`);
    const actionsToProcess = [...this.queue];
    
    // Sort by timestamp to preserve order
    actionsToProcess.sort((a, b) => a.timestamp - b.timestamp);

    for (const action of actionsToProcess) {
      try {
        await this.syncActionWithRemote(action);
        // Successfully synced, remove from queue
        this.queue = this.queue.filter(item => item.id !== action.id);
        await this.saveQueue();
      } catch (error) {
        console.error(`[Offline Queue] Sync failed for action ${action.id}. Will retry later.`, error);
        // Halt queue processing to preserve order in case of sequential dependencies
        break;
      }
    }

    this.isSyncing = false;
    this.notifyListeners();
    console.log(`[Offline Queue] Sync batch completed. Remaining queue length: ${this.queue.length}`);
  }

  private async syncActionWithRemote(action: OfflineAction): Promise<void> {
    // If Firebase config becomes active, synchronize with Firestore
    const { FirebaseService } = await import('./FirebaseService');
    if (FirebaseService.isConfigured()) {
      const db = FirebaseService.getFirestore();
      if (!db) return;

      console.log(`[Offline Queue] Syncing action with remote Firestore:`, action);
      const collectionService = (FirebaseService as any)[action.collection];
      
      if (collectionService) {
        if (action.type === 'CREATE') {
          await collectionService.create(action.payload, action.dataId);
        } else if (action.type === 'UPDATE') {
          await collectionService.update(action.dataId, action.payload);
        } else if (action.type === 'DELETE') {
          await collectionService.delete(action.dataId);
        }
      }
    } else {
      // In localStorage decoupled mode, syncing is already completed locally, 
      // but we log it for reference and simulate a minor delay
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log(`[Offline Queue] Simulated remote sync for local database:`, action);
    }
  }
}

export const OfflineQueueService = new OfflineQueueClass();
export default OfflineQueueService;

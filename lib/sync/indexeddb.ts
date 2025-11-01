/**
 * CRMS IndexedDB Schema
 * Offline-first storage for low-connectivity environments across Africa
 *
 * This IndexedDB implementation enables CRMS to work offline in areas
 * with limited or intermittent internet connectivity (2G/3G networks).
 */

import Dexie, { Table } from 'dexie';

// ==================== TYPE DEFINITIONS ====================

export interface PendingCase {
  id: string;
  caseNumber: string;
  title: string;
  description?: string;
  category: string;
  severity: string;
  status: string;
  incidentDate: Date;
  reportedDate: Date;
  location?: string;
  stationId: string;
  officerId: string;
  syncStatus: 'pending' | 'synced' | 'failed';
  syncError?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PendingPerson {
  id: string;
  nationalId?: string;
  idType?: string;           // "NIN", "GHANA_CARD", "HUDUMA_NAMBA", etc.
  countryCode?: string;       // ISO 3166-1 alpha-3
  fullName: string;
  aliases: string[];
  dob?: Date;
  gender?: string;
  nationality?: string;
  addressEncrypted?: string;  // Encrypted PII
  phoneEncrypted?: string;    // Encrypted PII
  emailEncrypted?: string;    // Encrypted PII
  photoUrl?: string;
  syncStatus: 'pending' | 'synced' | 'failed';
  syncError?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PendingEvidence {
  id: string;
  caseId: string;
  type: string;               // "photo", "document", "video", "physical", "digital"
  description?: string;
  qrCode: string;
  collectedDate: Date;
  collectedById: string;
  chainOfCustody: Array<{
    officerId: string;
    action: string;
    timestamp: Date;
    location?: string;
  }>;
  // Note: Actual files stored separately in browser File API or as base64
  fileData?: string;          // Base64 for small files only
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  syncStatus: 'pending' | 'synced' | 'failed';
  syncError?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncQueueItem {
  id: string;
  entityType: 'case' | 'person' | 'evidence' | 'note' | 'status_update';
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  payload: any;               // Full entity data for sync
  attempts: number;
  lastError?: string;
  priority: number;           // Higher = more urgent (default: 0)
  createdAt: Date;
}

// ==================== DEXIE DATABASE CLASS ====================

/**
 * CRMS Offline Database
 * Stores data locally for offline operation
 */
class CRMSDatabase extends Dexie {
  // Tables
  cases!: Table<PendingCase, string>;
  persons!: Table<PendingPerson, string>;
  evidence!: Table<PendingEvidence, string>;
  syncQueue!: Table<SyncQueueItem, string>;

  constructor() {
    super('crms-offline');

    // Define schema
    // Version 1: Initial schema
    this.version(1).stores({
      cases: 'id, caseNumber, stationId, officerId, syncStatus, createdAt, incidentDate',
      persons: 'id, nationalId, fullName, countryCode, syncStatus, createdAt',
      evidence: 'id, caseId, qrCode, syncStatus, createdAt',
      syncQueue: 'id, entityType, entityId, operation, priority, createdAt',
    });

    // Version 2: Add compound index for priority-based sync queue ordering
    // Required for syncEngine.syncAll() which sorts by [priority+createdAt]
    this.version(2).stores({
      syncQueue: 'id, entityType, entityId, operation, priority, createdAt, [priority+createdAt]',
    });

    // Add hooks for automatic timestamp updates
    this.cases.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
    });

    this.cases.hook('updating', (mods, primKey, obj) => {
      (mods as any).updatedAt = new Date();
    });

    this.persons.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
    });

    this.persons.hook('updating', (mods, primKey, obj) => {
      (mods as any).updatedAt = new Date();
    });

    this.evidence.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.updatedAt) obj.updatedAt = new Date();
    });

    this.evidence.hook('updating', (mods, primKey, obj) => {
      (mods as any).updatedAt = new Date();
    });

    this.syncQueue.hook('creating', (primKey, obj) => {
      if (!obj.createdAt) obj.createdAt = new Date();
      if (!obj.priority) obj.priority = 0;
    });
  }
}

// ==================== DATABASE INSTANCE ====================

/**
 * Singleton database instance
 * Use this throughout the application
 */
export const db = new CRMSDatabase();

// ==================== UTILITY FUNCTIONS ====================

/**
 * Clear all offline data (use with caution!)
 * Useful for testing or after successful full sync
 */
export async function clearOfflineData(): Promise<void> {
  await db.cases.clear();
  await db.persons.clear();
  await db.evidence.clear();
  await db.syncQueue.clear();
}

/**
 * Get sync statistics
 * Useful for displaying sync status to user
 */
export async function getSyncStats() {
  const [
    pendingCases,
    pendingPersons,
    pendingEvidence,
    queueLength,
    failedItems
  ] = await Promise.all([
    db.cases.where('syncStatus').equals('pending').count(),
    db.persons.where('syncStatus').equals('pending').count(),
    db.evidence.where('syncStatus').equals('pending').count(),
    db.syncQueue.count(),
    db.syncQueue.where('attempts').above(3).count(), // Failed after 3 attempts
  ]);

  return {
    pendingCases,
    pendingPersons,
    pendingEvidence,
    queueLength,
    failedItems,
    totalPending: pendingCases + pendingPersons + pendingEvidence,
  };
}

/**
 * Check if database is healthy
 * Returns true if IndexedDB is accessible
 */
export async function isIndexedDBAvailable(): Promise<boolean> {
  try {
    await db.cases.count();
    return true;
  } catch (error) {
    console.error('IndexedDB not available:', error);
    return false;
  }
}

/**
 * Export offline data as JSON (for debugging/backup)
 */
export async function exportOfflineData() {
  const [cases, persons, evidence, queue] = await Promise.all([
    db.cases.toArray(),
    db.persons.toArray(),
    db.evidence.toArray(),
    db.syncQueue.toArray(),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    data: {
      cases,
      persons,
      evidence,
      syncQueue: queue,
    },
  };
}

// ==================== REACT HOOKS EXPORTS ====================

// Re-export Dexie React hooks for use in components
export { useLiveQuery } from 'dexie-react-hooks';

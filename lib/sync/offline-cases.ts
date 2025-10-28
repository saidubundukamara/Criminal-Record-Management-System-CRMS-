/**
 * Offline Case Management
 * Utilities for creating and managing cases offline
 *
 * This module provides helper functions to work with cases in offline mode,
 * storing them in IndexedDB and queuing them for sync when online.
 */

import { db, type PendingCase } from './indexeddb';
import { syncEngine } from './engine';
import { v4 as uuid } from 'uuid';

// ==================== TYPES ====================

export interface CreateOfflineCaseInput {
  title: string;
  description?: string;
  category: string;
  severity: string;
  incidentDate: Date;
  location?: string;
  stationId: string;
  officerId: string;
  stationCode?: string;  // For generating case number
}

// ==================== OFFLINE CASE OPERATIONS ====================

/**
 * Create a case offline
 * Saves to IndexedDB and queues for sync
 */
export async function createOfflineCase(input: CreateOfflineCaseInput): Promise<PendingCase> {
  // Generate unique ID
  const caseId = uuid();

  // Generate temporary case number (will be regenerated on server)
  const year = new Date().getFullYear();
  const tempSequence = Math.floor(Math.random() * 9999) + 1;
  const stationCode = input.stationCode || 'TMP';
  const caseNumber = `${stationCode}-${year}-${String(tempSequence).padStart(6, '0')}-OFFLINE`;

  // Create pending case object
  const pendingCase: PendingCase = {
    id: caseId,
    caseNumber,
    title: input.title,
    description: input.description,
    category: input.category,
    severity: input.severity,
    status: 'open',
    incidentDate: input.incidentDate,
    reportedDate: new Date(),
    location: input.location,
    stationId: input.stationId,
    officerId: input.officerId,
    syncStatus: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Save to IndexedDB
  await db.cases.add(pendingCase);

  // Add to sync queue
  await syncEngine.addToQueue(
    'case',
    caseId,
    'create',
    {
      id: caseId,
      caseNumber,
      title: input.title,
      description: input.description,
      category: input.category,
      severity: input.severity,
      status: 'open',
      incidentDate: input.incidentDate.toISOString(),
      reportedDate: new Date().toISOString(),
      location: input.location,
      stationId: input.stationId,
      officerId: input.officerId,
    },
    1 // Priority 1 for new cases
  );

  console.log(`📝 Case created offline: ${caseNumber}`);

  return pendingCase;
}

/**
 * Update a case offline
 */
export async function updateOfflineCase(
  caseId: string,
  updates: Partial<Pick<PendingCase, 'title' | 'description' | 'category' | 'severity' | 'location'>>
): Promise<PendingCase> {
  // Get existing case
  const existingCase = await db.cases.get(caseId);
  if (!existingCase) {
    throw new Error('Case not found in offline storage');
  }

  // Update case
  const updatedCase: PendingCase = {
    ...existingCase,
    ...updates,
    updatedAt: new Date(),
    syncStatus: 'pending',
  };

  await db.cases.put(updatedCase);

  // Add to sync queue
  await syncEngine.addToQueue(
    'case',
    caseId,
    'update',
    {
      id: caseId,
      ...updates,
    },
    0 // Normal priority for updates
  );

  console.log(`✏️ Case updated offline: ${existingCase.caseNumber}`);

  return updatedCase;
}

/**
 * Get all offline cases for a station
 */
export async function getOfflineCases(stationId: string): Promise<PendingCase[]> {
  return await db.cases
    .where('stationId')
    .equals(stationId)
    .reverse() // Most recent first
    .sortBy('createdAt');
}

/**
 * Get a single offline case by ID
 */
export async function getOfflineCase(caseId: string): Promise<PendingCase | null> {
  const caseData = await db.cases.get(caseId);
  return caseData || null;
}

/**
 * Get offline case count for a station
 */
export async function getOfflineCaseCount(stationId: string): Promise<number> {
  return await db.cases
    .where('stationId')
    .equals(stationId)
    .count();
}

/**
 * Get pending (unsynced) case count
 */
export async function getPendingCaseCount(): Promise<number> {
  return await db.cases
    .where('syncStatus')
    .equals('pending')
    .count();
}

/**
 * Delete offline case (only if not yet synced)
 */
export async function deleteOfflineCase(caseId: string): Promise<void> {
  const caseData = await db.cases.get(caseId);

  if (!caseData) {
    throw new Error('Case not found in offline storage');
  }

  if (caseData.syncStatus === 'synced') {
    throw new Error('Cannot delete synced case from offline storage. Use the API instead.');
  }

  // Delete from IndexedDB
  await db.cases.delete(caseId);

  // Remove from sync queue (if exists)
  const queueItems = await db.syncQueue
    .where('entityId')
    .equals(caseId)
    .toArray();

  for (const item of queueItems) {
    await db.syncQueue.delete(item.id);
  }

  console.log(`🗑️ Deleted offline case: ${caseData.caseNumber}`);
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Check if a case is stored offline
 */
export async function isCaseOffline(caseId: string): Promise<boolean> {
  const caseData = await db.cases.get(caseId);
  return !!caseData;
}

/**
 * Get sync status of a case
 */
export async function getCaseSyncStatus(caseId: string): Promise<'pending' | 'synced' | 'failed' | null> {
  const caseData = await db.cases.get(caseId);
  return caseData?.syncStatus || null;
}

/**
 * Generate station code from station name (fallback)
 */
export function generateStationCode(stationName: string): string {
  return stationName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 3) || 'STA';
}

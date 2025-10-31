/**
 * Conflict Detector
 *
 * Detects and analyzes conflicts between local (offline) and server data.
 * Provides conflict metadata for manual resolution UI.
 *
 * Pan-African Design Considerations:
 * - Handles long offline periods (common in rural Africa)
 * - Efficient conflict detection for low-end devices
 * - Clear conflict descriptions for officers
 */

export type ConflictResolutionStrategy =
  | 'local' // Use local version
  | 'server' // Use server version
  | 'merge'; // Merge both versions (manual)

export interface FieldConflict {
  field: string;
  localValue: any;
  serverValue: any;
  isDifferent: boolean;
}

export interface ConflictDetails {
  entityType: 'case' | 'person' | 'evidence' | 'vehicle';
  entityId: string;
  localData: any;
  serverData: any;
  localTimestamp: Date;
  serverTimestamp: Date;
  conflicts: FieldConflict[];
  autoResolvable: boolean; // True if timestamps clearly indicate which is newer
  recommendedStrategy: ConflictResolutionStrategy;
  reason: string; // Human-readable explanation
}

/**
 * Compare two values for equality (deep comparison)
 */
function areValuesEqual(val1: any, val2: any): boolean {
  // Handle null/undefined
  if (val1 === val2) return true;
  if (val1 == null || val2 == null) return false;

  // Handle dates
  if (val1 instanceof Date && val2 instanceof Date) {
    return val1.getTime() === val2.getTime();
  }

  // Handle arrays
  if (Array.isArray(val1) && Array.isArray(val2)) {
    if (val1.length !== val2.length) return false;
    return val1.every((item, index) => areValuesEqual(item, val2[index]));
  }

  // Handle objects
  if (typeof val1 === 'object' && typeof val2 === 'object') {
    const keys1 = Object.keys(val1);
    const keys2 = Object.keys(val2);

    if (keys1.length !== keys2.length) return false;

    return keys1.every((key) => areValuesEqual(val1[key], val2[key]));
  }

  // Primitive comparison
  return val1 === val2;
}

/**
 * Detect conflicts between local and server data
 */
export function detectConflict(
  entityType: ConflictDetails['entityType'],
  entityId: string,
  localData: any,
  serverData: any
): ConflictDetails | null {
  // If no server data exists, no conflict (local is new)
  if (!serverData) {
    return null;
  }

  // If no local data exists, no conflict (server wins)
  if (!localData) {
    return null;
  }

  // Extract timestamps
  const localTimestamp = new Date(localData.updatedAt || localData.createdAt);
  const serverTimestamp = new Date(serverData.updatedAt || serverData.createdAt);

  // Compare field by field
  const conflicts: FieldConflict[] = [];
  const allFields = new Set([...Object.keys(localData), ...Object.keys(serverData)]);

  // Fields to ignore in conflict detection
  const ignoreFields = ['id', 'createdAt', 'syncStatus', 'version'];

  allFields.forEach((field) => {
    if (ignoreFields.includes(field)) return;

    const localValue = localData[field];
    const serverValue = serverData[field];
    const isDifferent = !areValuesEqual(localValue, serverValue);

    if (isDifferent) {
      conflicts.push({
        field,
        localValue,
        serverValue,
        isDifferent: true,
      });
    }
  });

  // If no conflicts, return null
  if (conflicts.length === 0) {
    return null;
  }

  // Determine if auto-resolvable
  const timeDiff = Math.abs(serverTimestamp.getTime() - localTimestamp.getTime());
  const autoResolvable = timeDiff > 5000; // 5 seconds difference = clear winner

  // Determine recommended strategy
  let recommendedStrategy: ConflictResolutionStrategy;
  let reason: string;

  if (autoResolvable) {
    // Use the newer version
    if (localTimestamp > serverTimestamp) {
      recommendedStrategy = 'local';
      reason = `Local version is newer (updated ${formatTimeDiff(timeDiff)} after server)`;
    } else {
      recommendedStrategy = 'server';
      reason = `Server version is newer (updated ${formatTimeDiff(timeDiff)} after local)`;
    }
  } else {
    // Too close to auto-resolve - require manual resolution
    recommendedStrategy = 'merge';
    reason = `Both versions updated within ${formatTimeDiff(timeDiff)} - manual review required`;
  }

  return {
    entityType,
    entityId,
    localData,
    serverData,
    localTimestamp,
    serverTimestamp,
    conflicts,
    autoResolvable,
    recommendedStrategy,
    reason,
  };
}

/**
 * Format time difference for human-readable display
 */
function formatTimeDiff(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  if (ms < 86400000) return `${Math.round(ms / 3600000)}h`;
  return `${Math.round(ms / 86400000)}d`;
}

/**
 * Resolve conflict based on strategy
 */
export function resolveConflict(
  conflict: ConflictDetails,
  strategy: ConflictResolutionStrategy,
  manualMergeData?: any
): any {
  switch (strategy) {
    case 'local':
      return conflict.localData;

    case 'server':
      return conflict.serverData;

    case 'merge':
      if (!manualMergeData) {
        throw new Error('Manual merge data required for merge strategy');
      }
      return manualMergeData;

    default:
      throw new Error(`Unknown resolution strategy: ${strategy}`);
  }
}

/**
 * Auto-resolve conflict if possible
 */
export function autoResolveConflict(conflict: ConflictDetails): {
  resolved: boolean;
  data?: any;
  strategy?: ConflictResolutionStrategy;
} {
  if (!conflict.autoResolvable) {
    return { resolved: false };
  }

  const strategy = conflict.recommendedStrategy;
  const data = resolveConflict(conflict, strategy);

  return {
    resolved: true,
    data,
    strategy,
  };
}

/**
 * Check if a sync operation would cause a conflict
 */
export async function checkForConflict(
  entityType: ConflictDetails['entityType'],
  entityId: string,
  localData: any
): Promise<ConflictDetails | null> {
  try {
    // Fetch current server data
    const response = await fetch(`/api/${entityType}s/${entityId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If 404, entity doesn't exist on server (no conflict)
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch server data: ${response.status}`);
    }

    const { [entityType]: serverData } = await response.json();

    // Detect conflict
    return detectConflict(entityType, entityId, localData, serverData);
  } catch (error) {
    console.error('Error checking for conflict:', error);
    // On error, assume no conflict (fail open)
    return null;
  }
}

/**
 * Get field-level diff for display
 */
export function getFieldDiff(conflict: FieldConflict): {
  field: string;
  type: 'added' | 'removed' | 'modified';
  localValueDisplay: string;
  serverValueDisplay: string;
} {
  const localValueDisplay = formatValueForDisplay(conflict.localValue);
  const serverValueDisplay = formatValueForDisplay(conflict.serverValue);

  let type: 'added' | 'removed' | 'modified';

  if (conflict.localValue == null && conflict.serverValue != null) {
    type = 'added';
  } else if (conflict.localValue != null && conflict.serverValue == null) {
    type = 'removed';
  } else {
    type = 'modified';
  }

  return {
    field: conflict.field,
    type,
    localValueDisplay,
    serverValueDisplay,
  };
}

/**
 * Format value for display in UI
 */
function formatValueForDisplay(value: any): string {
  if (value == null) return '(empty)';
  if (value instanceof Date) return value.toLocaleString();
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

/**
 * Merge two objects with conflict tracking
 */
export function mergeWithConflictTracking(
  local: any,
  server: any,
  userSelections: Record<string, 'local' | 'server'>
): any {
  const result: any = {};

  // Get all unique fields
  const allFields = new Set([...Object.keys(local), ...Object.keys(server)]);

  allFields.forEach((field) => {
    const hasLocal = field in local;
    const hasServer = field in server;

    if (!hasLocal && !hasServer) return;

    // Use user selection if provided
    if (field in userSelections) {
      result[field] = userSelections[field] === 'local' ? local[field] : server[field];
      return;
    }

    // If only one has the field, use that
    if (hasLocal && !hasServer) {
      result[field] = local[field];
      return;
    }

    if (!hasLocal && hasServer) {
      result[field] = server[field];
      return;
    }

    // Both have the field - use server as default (can be overridden by user)
    result[field] = server[field];
  });

  return result;
}

/**
 * Get conflict summary for display
 */
export function getConflictSummary(conflict: ConflictDetails): string {
  const conflictCount = conflict.conflicts.length;
  const conflictFields = conflict.conflicts.map((c) => c.field).join(', ');

  return `${conflictCount} field${conflictCount !== 1 ? 's' : ''} changed: ${conflictFields}`;
}

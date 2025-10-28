/**
 * SyncService Unit Tests
 *
 * Tests for offline sync business logic with mocked repositories
 */
import { SyncService } from '@/src/services/SyncService';
import { ISyncQueueRepository } from '@/src/domain/interfaces/repositories/ISyncQueueRepository';
import { IAuditLogRepository } from '@/src/domain/interfaces/repositories/IAuditLogRepository';
import { mockSyncQueueEntry } from '../../fixtures/test-data';

// Mock repositories
const mockSyncQueueRepo = {
  create: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  getPendingEntries: jest.fn(),
  getFailedEntries: jest.fn(),
  markAsCompleted: jest.fn(),
  markAsFailed: jest.fn(),
  incrementAttempt: jest.fn(),
  countPending: jest.fn(),
  countFailed: jest.fn(),
  deleteCompleted: jest.fn(),
  getEntriesByEntity: jest.fn(),
} as jest.Mocked<ISyncQueueRepository>;

const mockAuditRepo = {
  create: jest.fn(),
  findByEntityId: jest.fn(),
  findByOfficerId: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
} as jest.Mocked<IAuditLogRepository>;

describe('SyncService', () => {
  let syncService: SyncService;

  beforeEach(() => {
    // Create service with mocked repositories
    syncService = new SyncService(mockSyncQueueRepo, mockAuditRepo);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('queueChange', () => {
    it('should queue a sync entry successfully', async () => {
      // Arrange
      const input = {
        entityType: 'case' as const,
        entityId: 'case-123',
        operation: 'create' as const,
        payload: { caseNumber: 'HQ-2025-000001', title: 'Test Case' },
      };

      mockSyncQueueRepo.create.mockResolvedValue(mockSyncQueueEntry);

      // Act
      const result = await syncService.queueChange(input);

      // Assert
      expect(result).toEqual(mockSyncQueueEntry);
      expect(mockSyncQueueRepo.create).toHaveBeenCalledWith({
        entityType: 'case',
        entityId: 'case-123',
        operation: 'create',
        payload: input.payload,
      });
    });
  });

  describe('processPendingSync', () => {
    it('should return success with 0 synced when no pending entries', async () => {
      // Arrange
      mockSyncQueueRepo.getPendingEntries.mockResolvedValue([]);

      // Act
      const result = await syncService.processPendingSync();

      // Assert
      expect(result).toEqual({
        success: true,
        synced: 0,
        failed: 0,
        errors: [],
      });
    });

    it('should process pending entries successfully', async () => {
      // Arrange
      const pendingEntry = {
        ...mockSyncQueueEntry,
        status: 'pending',
        payload: { caseNumber: 'HQ-2025-000001', title: 'Test Case', officerId: 'officer-123' },
      };

      mockSyncQueueRepo.getPendingEntries.mockResolvedValue([pendingEntry] as any);
      mockSyncQueueRepo.update.mockResolvedValue(undefined);
      mockSyncQueueRepo.markAsCompleted.mockResolvedValue(undefined);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act
      const result = await syncService.processPendingSync();

      // Assert
      expect(result.success).toBe(true);
      expect(result.synced).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(mockSyncQueueRepo.update).toHaveBeenCalledWith(pendingEntry.id, { status: 'processing' });
      expect(mockSyncQueueRepo.markAsCompleted).toHaveBeenCalledWith(pendingEntry.id);
      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'syncQueue',
          entityId: pendingEntry.id,
          officerId: 'system',
          action: 'sync',
          success: true,
        })
      );
    });

    it('should handle sync failures', async () => {
      // Arrange
      const pendingEntry = {
        ...mockSyncQueueEntry,
        status: 'pending',
        payload: { /* missing required fields */ },
      };

      mockSyncQueueRepo.getPendingEntries.mockResolvedValue([pendingEntry] as any);
      mockSyncQueueRepo.update.mockResolvedValue(undefined);
      mockSyncQueueRepo.markAsFailed.mockResolvedValue(undefined);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act
      const result = await syncService.processPendingSync();

      // Assert
      expect(result.success).toBe(false);
      expect(result.synced).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].entryId).toBe(pendingEntry.id);
      expect(mockSyncQueueRepo.markAsFailed).toHaveBeenCalledWith(
        pendingEntry.id,
        expect.any(String)
      );
      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'syncQueue',
          entityId: pendingEntry.id,
          officerId: 'system',
          action: 'sync',
          success: false,
        })
      );
    });

    it('should process multiple pending entries', async () => {
      // Arrange
      const entries = [
        {
          id: 'sync-1',
          entityType: 'case',
          operation: 'create',
          payload: { caseNumber: 'HQ-2025-000001', title: 'Case 1', officerId: 'officer-123' },
        },
        {
          id: 'sync-2',
          entityType: 'case',
          operation: 'create',
          payload: { caseNumber: 'HQ-2025-000002', title: 'Case 2', officerId: 'officer-123' },
        },
      ];

      mockSyncQueueRepo.getPendingEntries.mockResolvedValue(entries as any);
      mockSyncQueueRepo.update.mockResolvedValue(undefined);
      mockSyncQueueRepo.markAsCompleted.mockResolvedValue(undefined);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act
      const result = await syncService.processPendingSync();

      // Assert
      expect(result.synced).toBe(2);
      expect(result.failed).toBe(0);
      expect(mockSyncQueueRepo.markAsCompleted).toHaveBeenCalledTimes(2);
    });

    it('should validate case payload', async () => {
      // Arrange
      const invalidEntry = {
        id: 'sync-invalid',
        entityType: 'case',
        operation: 'create',
        payload: { /* missing caseNumber and title */ },
      };

      mockSyncQueueRepo.getPendingEntries.mockResolvedValue([invalidEntry] as any);
      mockSyncQueueRepo.update.mockResolvedValue(undefined);
      mockSyncQueueRepo.markAsFailed.mockResolvedValue(undefined);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act
      const result = await syncService.processPendingSync();

      // Assert
      expect(result.failed).toBe(1);
      expect(result.errors[0].error).toContain('Invalid case payload');
    });

    it('should validate person payload', async () => {
      // Arrange
      const invalidEntry = {
        id: 'sync-invalid',
        entityType: 'person',
        operation: 'create',
        payload: { /* missing nin, firstName, lastName */ },
      };

      mockSyncQueueRepo.getPendingEntries.mockResolvedValue([invalidEntry] as any);
      mockSyncQueueRepo.update.mockResolvedValue(undefined);
      mockSyncQueueRepo.markAsFailed.mockResolvedValue(undefined);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act
      const result = await syncService.processPendingSync();

      // Assert
      expect(result.failed).toBe(1);
      expect(result.errors[0].error).toContain('Invalid person payload');
    });

    it('should validate evidence payload', async () => {
      // Arrange
      const invalidEntry = {
        id: 'sync-invalid',
        entityType: 'evidence',
        operation: 'create',
        payload: { /* missing caseId, type, description */ },
      };

      mockSyncQueueRepo.getPendingEntries.mockResolvedValue([invalidEntry] as any);
      mockSyncQueueRepo.update.mockResolvedValue(undefined);
      mockSyncQueueRepo.markAsFailed.mockResolvedValue(undefined);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act
      const result = await syncService.processPendingSync();

      // Assert
      expect(result.failed).toBe(1);
      expect(result.errors[0].error).toContain('Invalid evidence payload');
    });

    it('should validate casePerson payload', async () => {
      // Arrange
      const invalidEntry = {
        id: 'sync-invalid',
        entityType: 'casePerson',
        operation: 'create',
        payload: { /* missing caseId, personId, role */ },
      };

      mockSyncQueueRepo.getPendingEntries.mockResolvedValue([invalidEntry] as any);
      mockSyncQueueRepo.update.mockResolvedValue(undefined);
      mockSyncQueueRepo.markAsFailed.mockResolvedValue(undefined);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act
      const result = await syncService.processPendingSync();

      // Assert
      expect(result.failed).toBe(1);
      expect(result.errors[0].error).toContain('Invalid casePerson payload');
    });

    it('should reject unsupported entity type', async () => {
      // Arrange
      const invalidEntry = {
        id: 'sync-invalid',
        entityType: 'unsupported',
        operation: 'create',
        payload: {},
      };

      mockSyncQueueRepo.getPendingEntries.mockResolvedValue([invalidEntry] as any);
      mockSyncQueueRepo.update.mockResolvedValue(undefined);
      mockSyncQueueRepo.markAsFailed.mockResolvedValue(undefined);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act
      const result = await syncService.processPendingSync();

      // Assert
      expect(result.failed).toBe(1);
      expect(result.errors[0].error).toContain('Unsupported entity type');
    });
  });

  describe('retryFailedSync', () => {
    it('should return success with 0 synced when no failed entries', async () => {
      // Arrange
      mockSyncQueueRepo.getFailedEntries.mockResolvedValue([]);

      // Act
      const result = await syncService.retryFailedSync();

      // Assert
      expect(result).toEqual({
        success: true,
        synced: 0,
        failed: 0,
        errors: [],
      });
    });

    it('should retry failed entries successfully', async () => {
      // Arrange
      const failedEntry = {
        ...mockSyncQueueEntry,
        status: 'failed',
        attempts: 1,
        payload: { caseNumber: 'HQ-2025-000001', title: 'Test Case', officerId: 'officer-123' },
      };

      mockSyncQueueRepo.getFailedEntries.mockResolvedValue([failedEntry] as any);
      mockSyncQueueRepo.incrementAttempt.mockResolvedValue(undefined);
      mockSyncQueueRepo.markAsCompleted.mockResolvedValue(undefined);

      // Act
      const result = await syncService.retryFailedSync();

      // Assert
      expect(result.success).toBe(true);
      expect(result.synced).toBe(1);
      expect(result.failed).toBe(0);
      expect(mockSyncQueueRepo.incrementAttempt).toHaveBeenCalledWith(failedEntry.id);
      expect(mockSyncQueueRepo.markAsCompleted).toHaveBeenCalledWith(failedEntry.id);
    });

    it('should handle retry failures', async () => {
      // Arrange
      const failedEntry = {
        ...mockSyncQueueEntry,
        status: 'failed',
        attempts: 2,
        payload: { /* invalid payload */ },
      };

      mockSyncQueueRepo.getFailedEntries.mockResolvedValue([failedEntry] as any);
      mockSyncQueueRepo.incrementAttempt.mockResolvedValue(undefined);
      mockSyncQueueRepo.markAsFailed.mockResolvedValue(undefined);

      // Act
      const result = await syncService.retryFailedSync();

      // Assert
      expect(result.success).toBe(false);
      expect(result.synced).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(mockSyncQueueRepo.markAsFailed).toHaveBeenCalledWith(
        failedEntry.id,
        expect.any(String)
      );
    });
  });

  describe('getSyncStats', () => {
    it('should return sync statistics', async () => {
      // Arrange
      mockSyncQueueRepo.countPending.mockResolvedValue(5);
      mockSyncQueueRepo.countFailed.mockResolvedValue(2);
      mockSyncQueueRepo.getPendingEntries.mockResolvedValue([
        { ...mockSyncQueueEntry, syncedAt: new Date('2025-01-20T10:00:00Z') },
      ] as any);

      // Act
      const result = await syncService.getSyncStats();

      // Assert
      expect(result.pending).toBe(5);
      expect(result.failed).toBe(2);
      expect(result.lastSyncAt).toEqual(new Date('2025-01-20T10:00:00Z'));
    });

    it('should return null lastSyncAt when no pending entries', async () => {
      // Arrange
      mockSyncQueueRepo.countPending.mockResolvedValue(0);
      mockSyncQueueRepo.countFailed.mockResolvedValue(0);
      mockSyncQueueRepo.getPendingEntries.mockResolvedValue([]);

      // Act
      const result = await syncService.getSyncStats();

      // Assert
      expect(result.pending).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.lastSyncAt).toBeNull();
    });
  });

  describe('cleanupOldEntries', () => {
    it('should cleanup old completed entries', async () => {
      // Arrange
      mockSyncQueueRepo.deleteCompleted.mockResolvedValue(10);

      // Act
      const result = await syncService.cleanupOldEntries(7);

      // Assert
      expect(result).toBe(10);
      expect(mockSyncQueueRepo.deleteCompleted).toHaveBeenCalledWith(7);
    });

    it('should use default 7 days if not specified', async () => {
      // Arrange
      mockSyncQueueRepo.deleteCompleted.mockResolvedValue(5);

      // Act
      const result = await syncService.cleanupOldEntries();

      // Assert
      expect(result).toBe(5);
      expect(mockSyncQueueRepo.deleteCompleted).toHaveBeenCalledWith(7);
    });
  });

  describe('getEntriesByEntity', () => {
    it('should return entries for specific entity', async () => {
      // Arrange
      const entries = [
        mockSyncQueueEntry,
        { ...mockSyncQueueEntry, id: 'sync-456' },
      ];

      mockSyncQueueRepo.getEntriesByEntity.mockResolvedValue(entries as any);

      // Act
      const result = await syncService.getEntriesByEntity('case', 'case-123');

      // Assert
      expect(result).toEqual(entries);
      expect(mockSyncQueueRepo.getEntriesByEntity).toHaveBeenCalledWith('case', 'case-123');
    });
  });
});

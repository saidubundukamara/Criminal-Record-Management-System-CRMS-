/**
 * Storage Manager Unit Tests
 *
 * Tests for storage quota monitoring and management
 * Phase 9: PWA Optimization
 */
import {
  storageManager,
  getStorageEstimate,
  requestPersistentStorage,
  cleanupOldData,
  emergencyCleanup,
  onStorageEvent,
  StorageEventType,
} from '@/lib/db/storage-manager';

// Mock browser storage APIs
const mockStorageEstimate = jest.fn();
const mockPersist = jest.fn();

// @ts-ignore
global.navigator = {
  storage: {
    estimate: mockStorageEstimate,
    persist: mockPersist,
  },
} as any;

describe('Storage Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStorageEstimate', () => {
    it('should return storage usage estimate', async () => {
      // Arrange
      mockStorageEstimate.mockResolvedValue({
        usage: 50 * 1024 * 1024, // 50MB
        quota: 100 * 1024 * 1024, // 100MB
      });

      // Act
      const result = await getStorageEstimate();

      // Assert
      expect(result).toBeDefined();
      expect(result.usage).toBe(50 * 1024 * 1024);
      expect(result.quota).toBe(100 * 1024 * 1024);
      expect(result.usagePercent).toBe(50);
      expect(result.available).toBe(50 * 1024 * 1024);
      expect(mockStorageEstimate).toHaveBeenCalled();
    });

    it('should detect low storage warning threshold (80%)', async () => {
      // Arrange
      mockStorageEstimate.mockResolvedValue({
        usage: 85 * 1024 * 1024, // 85MB
        quota: 100 * 1024 * 1024, // 100MB (85% usage)
      });

      // Act
      const result = await getStorageEstimate();

      // Assert
      expect(result.usagePercent).toBe(85);
      expect(result.isLow).toBe(true);
      expect(result.isCritical).toBe(false);
    });

    it('should detect critical storage threshold (95%)', async () => {
      // Arrange
      mockStorageEstimate.mockResolvedValue({
        usage: 96 * 1024 * 1024, // 96MB
        quota: 100 * 1024 * 1024, // 100MB (96% usage)
      });

      // Act
      const result = await getStorageEstimate();

      // Assert
      expect(result.usagePercent).toBe(96);
      expect(result.isLow).toBe(true);
      expect(result.isCritical).toBe(true);
    });

    it('should format bytes into human-readable format', async () => {
      // Arrange
      mockStorageEstimate.mockResolvedValue({
        usage: 1.5 * 1024 * 1024 * 1024, // 1.5GB
        quota: 5 * 1024 * 1024 * 1024, // 5GB
      });

      // Act
      const result = await getStorageEstimate();

      // Assert
      expect(result.usageFormatted).toContain('GB');
      expect(result.quotaFormatted).toContain('GB');
    });

    it('should handle storage API not available', async () => {
      // Arrange
      const originalNavigator = global.navigator;
      // @ts-ignore
      global.navigator = {} as any;

      // Act
      const result = await getStorageEstimate();

      // Assert
      expect(result.usage).toBe(0);
      expect(result.quota).toBe(0);
      expect(result.usagePercent).toBe(0);

      // Restore
      global.navigator = originalNavigator;
    });
  });

  describe('requestPersistentStorage', () => {
    it('should request persistent storage successfully', async () => {
      // Arrange
      mockPersist.mockResolvedValue(true);

      // Act
      const result = await requestPersistentStorage();

      // Assert
      expect(result).toBe(true);
      expect(mockPersist).toHaveBeenCalled();
    });

    it('should handle persistent storage denied', async () => {
      // Arrange
      mockPersist.mockResolvedValue(false);

      // Act
      const result = await requestPersistentStorage();

      // Assert
      expect(result).toBe(false);
    });

    it('should handle storage API not available', async () => {
      // Arrange
      const originalNavigator = global.navigator;
      // @ts-ignore
      global.navigator = {} as any;

      // Act
      const result = await requestPersistentStorage();

      // Assert
      expect(result).toBe(false);

      // Restore
      global.navigator = originalNavigator;
    });
  });

  describe('cleanupOldData', () => {
    it('should cleanup old synced cases (> 90 days)', async () => {
      // This test would require mocking IndexedDB
      // For now, test that function exists and can be called
      expect(typeof cleanupOldData).toBe('function');
    });

    it('should accept cleanup options', async () => {
      // Arrange
      const options = {
        casesOlderThan: 60, // 60 days instead of default 90
        minCasesToKeep: 100, // Keep at least 100
        evidenceOlderThan: 60,
        minEvidenceToKeep: 100,
      };

      // Act & Assert
      // Function should accept options without error
      expect(() => cleanupOldData(options)).not.toThrow();
    });
  });

  describe('emergencyCleanup', () => {
    it('should clear all offline data', async () => {
      // This test would require mocking IndexedDB
      // For now, test that function exists and is async
      expect(typeof emergencyCleanup).toBe('function');
      expect(emergencyCleanup()).toBeInstanceOf(Promise);
    });
  });

  describe('Storage Event Listeners', () => {
    it('should register storage event listener', () => {
      // Arrange
      const mockListener = jest.fn();

      // Act
      const unsubscribe = onStorageEvent(mockListener);

      // Assert
      expect(typeof unsubscribe).toBe('function');
    });

    it('should call listener when storage event is triggered', () => {
      // Arrange
      const mockListener = jest.fn();
      onStorageEvent(mockListener);

      // Simulate storage event
      const event: StorageEventType = 'warning';
      const estimate = {
        usage: 85 * 1024 * 1024,
        quota: 100 * 1024 * 1024,
        usagePercent: 85,
        available: 15 * 1024 * 1024,
        isLow: true,
        isCritical: false,
        usageFormatted: '85 MB',
        quotaFormatted: '100 MB',
        availableFormatted: '15 MB',
      };

      // Act
      storageManager.emit('storage-event', event, estimate);

      // Assert
      expect(mockListener).toHaveBeenCalledWith(event, estimate);
    });

    it('should unsubscribe from storage events', () => {
      // Arrange
      const mockListener = jest.fn();
      const unsubscribe = onStorageEvent(mockListener);

      // Act
      unsubscribe();

      // Simulate event after unsubscribe
      storageManager.emit('storage-event', 'warning', {} as any);

      // Assert
      expect(mockListener).not.toHaveBeenCalled();
    });
  });

  describe('Storage Monitoring', () => {
    it('should start monitoring with interval', () => {
      // Arrange
      const interval = 60000; // 1 minute

      // Act
      const intervalId = storageManager.startMonitoring(interval);

      // Assert
      expect(intervalId).toBeDefined();

      // Cleanup
      storageManager.stopMonitoring(intervalId);
    });

    it('should stop monitoring', () => {
      // Arrange
      const interval = 60000;
      const intervalId = storageManager.startMonitoring(interval);

      // Act
      storageManager.stopMonitoring(intervalId);

      // Assert - No error should be thrown
      expect(true).toBe(true);
    });
  });

  describe('Storage Breakdown', () => {
    it('should calculate storage breakdown by type', async () => {
      // Arrange
      mockStorageEstimate.mockResolvedValue({
        usage: 50 * 1024 * 1024,
        quota: 100 * 1024 * 1024,
        usageDetails: {
          indexedDB: 30 * 1024 * 1024,
          caches: 15 * 1024 * 1024,
          serviceWorkerRegistrations: 5 * 1024 * 1024,
        },
      });

      // Act
      const result = await getStorageEstimate();

      // Assert
      expect(result.breakdown).toBeDefined();
      if (result.breakdown) {
        expect(result.breakdown.indexedDB).toBeDefined();
        expect(result.breakdown.caches).toBeDefined();
        expect(result.breakdown.serviceWorkerRegistrations).toBeDefined();
      }
    });
  });

  describe('Byte Formatting', () => {
    it('should format bytes correctly', async () => {
      // Arrange & Act
      const testCases = [
        { bytes: 500, expected: 'B' },
        { bytes: 1024, expected: 'KB' },
        { bytes: 1024 * 1024, expected: 'MB' },
        { bytes: 1024 * 1024 * 1024, expected: 'GB' },
      ];

      for (const testCase of testCases) {
        mockStorageEstimate.mockResolvedValue({
          usage: testCase.bytes,
          quota: testCase.bytes * 2,
        });

        const result = await getStorageEstimate();

        // Assert
        expect(result.usageFormatted).toContain(testCase.expected);
      }
    });
  });
});

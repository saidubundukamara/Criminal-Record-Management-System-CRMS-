/**
 * Conflict Detector Unit Tests
 *
 * Tests for conflict detection logic in offline sync
 * Phase 9: PWA Optimization
 */
import {
  ConflictDetector,
  ConflictResolutionStrategy,
  detectConflict,
  autoResolveConflict,
  mergeWithConflictTracking,
} from '@/lib/sync/conflict-detector';

describe('ConflictDetector', () => {
  describe('detectConflict', () => {
    it('should detect no conflict when data is identical', () => {
      // Arrange
      const local = {
        id: 'case-123',
        title: 'Theft Case',
        description: 'Description',
        status: 'investigating',
        updatedAt: '2025-01-15T10:00:00Z',
      };

      const server = {
        id: 'case-123',
        title: 'Theft Case',
        description: 'Description',
        status: 'investigating',
        updatedAt: '2025-01-15T10:00:00Z',
      };

      // Act
      const result = detectConflict(local, server);

      // Assert
      expect(result.hasConflict).toBe(false);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should detect conflict when fields differ', () => {
      // Arrange
      const local = {
        id: 'case-123',
        title: 'Theft Case - Local Edit',
        description: 'Local description',
        status: 'investigating',
        updatedAt: '2025-01-15T10:00:00Z',
      };

      const server = {
        id: 'case-123',
        title: 'Theft Case - Server Edit',
        description: 'Server description',
        status: 'charged',
        updatedAt: '2025-01-15T10:05:00Z',
      };

      // Act
      const result = detectConflict(local, server);

      // Assert
      expect(result.hasConflict).toBe(true);
      expect(result.conflicts.length).toBeGreaterThan(0);

      // Check specific conflicts
      const titleConflict = result.conflicts.find((c) => c.field === 'title');
      expect(titleConflict).toBeDefined();
      expect(titleConflict?.localValue).toBe('Theft Case - Local Edit');
      expect(titleConflict?.serverValue).toBe('Theft Case - Server Edit');

      const statusConflict = result.conflicts.find((c) => c.field === 'status');
      expect(statusConflict).toBeDefined();
      expect(statusConflict?.localValue).toBe('investigating');
      expect(statusConflict?.serverValue).toBe('charged');
    });

    it('should handle nested object conflicts', () => {
      // Arrange
      const local = {
        id: 'case-123',
        metadata: {
          priority: 'high',
          tags: ['urgent', 'theft'],
        },
        updatedAt: '2025-01-15T10:00:00Z',
      };

      const server = {
        id: 'case-123',
        metadata: {
          priority: 'low',
          tags: ['theft', 'resolved'],
        },
        updatedAt: '2025-01-15T10:05:00Z',
      };

      // Act
      const result = detectConflict(local, server);

      // Assert
      expect(result.hasConflict).toBe(true);

      const metadataConflict = result.conflicts.find((c) => c.field === 'metadata');
      expect(metadataConflict).toBeDefined();
    });

    it('should handle array conflicts', () => {
      // Arrange
      const local = {
        id: 'case-123',
        tags: ['theft', 'urgent', 'local-tag'],
        updatedAt: '2025-01-15T10:00:00Z',
      };

      const server = {
        id: 'case-123',
        tags: ['theft', 'resolved', 'server-tag'],
        updatedAt: '2025-01-15T10:05:00Z',
      };

      // Act
      const result = detectConflict(local, server);

      // Assert
      expect(result.hasConflict).toBe(true);

      const tagsConflict = result.conflicts.find((c) => c.field === 'tags');
      expect(tagsConflict).toBeDefined();
    });

    it('should handle date conflicts', () => {
      // Arrange
      const local = {
        id: 'case-123',
        incidentDate: new Date('2025-01-10T10:00:00Z'),
        updatedAt: '2025-01-15T10:00:00Z',
      };

      const server = {
        id: 'case-123',
        incidentDate: new Date('2025-01-11T10:00:00Z'),
        updatedAt: '2025-01-15T10:05:00Z',
      };

      // Act
      const result = detectConflict(local, server);

      // Assert
      expect(result.hasConflict).toBe(true);

      const dateConflict = result.conflicts.find((c) => c.field === 'incidentDate');
      expect(dateConflict).toBeDefined();
    });

    it('should ignore updatedAt field in conflict detection', () => {
      // Arrange
      const local = {
        id: 'case-123',
        title: 'Same Title',
        updatedAt: '2025-01-15T10:00:00Z',
      };

      const server = {
        id: 'case-123',
        title: 'Same Title',
        updatedAt: '2025-01-15T10:05:00Z', // Different updatedAt
      };

      // Act
      const result = detectConflict(local, server);

      // Assert
      expect(result.hasConflict).toBe(false);
      expect(result.conflicts).toHaveLength(0);
    });
  });

  describe('autoResolveConflict', () => {
    it('should recommend server version when timestamps differ by > 5 seconds', () => {
      // Arrange
      const local = {
        id: 'case-123',
        title: 'Local Edit',
        updatedAt: '2025-01-15T10:00:00Z', // 10:00:00
      };

      const server = {
        id: 'case-123',
        title: 'Server Edit',
        updatedAt: '2025-01-15T10:00:10Z', // 10:00:10 (10 seconds later)
      };

      const conflicts = [
        {
          field: 'title',
          localValue: 'Local Edit',
          serverValue: 'Server Edit',
          reason: 'Values differ',
        },
      ];

      // Act
      const result = autoResolveConflict(local, server, conflicts);

      // Assert
      expect(result.canAutoResolve).toBe(true);
      expect(result.recommendedStrategy).toBe('server');
      expect(result.resolved).toEqual(server);
    });

    it('should recommend local version when local is newer by > 5 seconds', () => {
      // Arrange
      const local = {
        id: 'case-123',
        title: 'Local Edit',
        updatedAt: '2025-01-15T10:00:10Z', // 10:00:10 (newer)
      };

      const server = {
        id: 'case-123',
        title: 'Server Edit',
        updatedAt: '2025-01-15T10:00:00Z', // 10:00:00
      };

      const conflicts = [
        {
          field: 'title',
          localValue: 'Local Edit',
          serverValue: 'Server Edit',
          reason: 'Values differ',
        },
      ];

      // Act
      const result = autoResolveConflict(local, server, conflicts);

      // Assert
      expect(result.canAutoResolve).toBe(true);
      expect(result.recommendedStrategy).toBe('local');
      expect(result.resolved).toEqual(local);
    });

    it('should require manual resolution when timestamps within 5 seconds', () => {
      // Arrange
      const local = {
        id: 'case-123',
        title: 'Local Edit',
        updatedAt: '2025-01-15T10:00:00Z',
      };

      const server = {
        id: 'case-123',
        title: 'Server Edit',
        updatedAt: '2025-01-15T10:00:03Z', // Only 3 seconds difference
      };

      const conflicts = [
        {
          field: 'title',
          localValue: 'Local Edit',
          serverValue: 'Server Edit',
          reason: 'Values differ',
        },
      ];

      // Act
      const result = autoResolveConflict(local, server, conflicts);

      // Assert
      expect(result.canAutoResolve).toBe(false);
      expect(result.recommendedStrategy).toBe('merge');
      expect(result.resolved).toBeNull();
    });

    it('should handle missing updatedAt timestamps', () => {
      // Arrange
      const local = {
        id: 'case-123',
        title: 'Local Edit',
      };

      const server = {
        id: 'case-123',
        title: 'Server Edit',
      };

      const conflicts = [
        {
          field: 'title',
          localValue: 'Local Edit',
          serverValue: 'Server Edit',
          reason: 'Values differ',
        },
      ];

      // Act
      const result = autoResolveConflict(local, server, conflicts);

      // Assert
      expect(result.canAutoResolve).toBe(false);
      expect(result.recommendedStrategy).toBe('merge');
    });
  });

  describe('mergeWithConflictTracking', () => {
    it('should merge using field-level selections', () => {
      // Arrange
      const local = {
        id: 'case-123',
        title: 'Local Title',
        description: 'Local Description',
        status: 'investigating',
      };

      const server = {
        id: 'case-123',
        title: 'Server Title',
        description: 'Server Description',
        status: 'charged',
      };

      const selections: Record<string, 'local' | 'server'> = {
        title: 'local', // Keep local title
        description: 'server', // Keep server description
        status: 'local', // Keep local status
      };

      // Act
      const result = mergeWithConflictTracking(local, server, selections);

      // Assert
      expect(result.id).toBe('case-123');
      expect(result.title).toBe('Local Title');
      expect(result.description).toBe('Server Description');
      expect(result.status).toBe('investigating');
    });

    it('should preserve non-conflicting fields', () => {
      // Arrange
      const local = {
        id: 'case-123',
        title: 'Local Title',
        caseNumber: 'HQ-2025-000001',
        nonConflictingField: 'Same value',
      };

      const server = {
        id: 'case-123',
        title: 'Server Title',
        caseNumber: 'HQ-2025-000001',
        nonConflictingField: 'Same value',
      };

      const selections: Record<string, 'local' | 'server'> = {
        title: 'server',
      };

      // Act
      const result = mergeWithConflictTracking(local, server, selections);

      // Assert
      expect(result.caseNumber).toBe('HQ-2025-000001');
      expect(result.nonConflictingField).toBe('Same value');
    });

    it('should handle nested object merges', () => {
      // Arrange
      const local = {
        id: 'case-123',
        metadata: {
          priority: 'high',
          tags: ['urgent'],
        },
      };

      const server = {
        id: 'case-123',
        metadata: {
          priority: 'low',
          tags: ['resolved'],
        },
      };

      const selections: Record<string, 'local' | 'server'> = {
        'metadata.priority': 'local',
        'metadata.tags': 'server',
      };

      // Act
      const result = mergeWithConflictTracking(local, server, selections);

      // Assert
      expect(result.metadata.priority).toBe('high');
      expect(result.metadata.tags).toEqual(['resolved']);
    });
  });

  describe('ConflictResolutionStrategy', () => {
    it('should define all strategy types', () => {
      // Assert
      const strategies: ConflictResolutionStrategy[] = ['local', 'server', 'merge'];

      expect(strategies).toHaveLength(3);
      expect(strategies).toContain('local');
      expect(strategies).toContain('server');
      expect(strategies).toContain('merge');
    });
  });
});

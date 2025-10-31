/**
 * AnalyticsService Unit Tests
 *
 * Tests for Analytics business logic with mocked repositories
 * Phase 8: Dashboards & Reporting
 */
import { AnalyticsService } from '@/src/services/AnalyticsService';
import { ICaseRepository } from '@/src/domain/interfaces/repositories/ICaseRepository';
import { IPersonRepository } from '@/src/domain/interfaces/repositories/IPersonRepository';
import { IEvidenceRepository } from '@/src/domain/interfaces/repositories/IEvidenceRepository';
import { IAuditLogRepository } from '@/src/domain/interfaces/repositories/IAuditLogRepository';
import { IBackgroundCheckRepository } from '@/src/domain/interfaces/repositories/IBackgroundCheckRepository';
import { IAmberAlertRepository } from '@/src/domain/interfaces/repositories/IAmberAlertRepository';
import { IVehicleRepository } from '@/src/domain/interfaces/repositories/IVehicleRepository';
import { Case } from '@/src/domain/entities/Case';

// Mock repositories
const mockCaseRepo = {
  findById: jest.fn(),
  findByCaseNumber: jest.fn(),
  findByStationId: jest.fn(),
  findByOfficerId: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
  search: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  updateStatus: jest.fn(),
  addPerson: jest.fn(),
  removePerson: jest.fn(),
  addNote: jest.fn(),
} as jest.Mocked<ICaseRepository>;

const mockPersonRepo = {
  findById: jest.fn(),
  findByNin: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
  search: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
} as jest.Mocked<IPersonRepository>;

const mockEvidenceRepo = {
  findById: jest.fn(),
  findByCaseId: jest.fn(),
  findByStationId: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
  search: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  updateChainOfCustody: jest.fn(),
} as jest.Mocked<IEvidenceRepository>;

const mockAuditRepo = {
  create: jest.fn(),
  findByEntityId: jest.fn(),
  findByOfficerId: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
} as jest.Mocked<IAuditLogRepository>;

const mockBackgroundCheckRepo = {
  findById: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
} as jest.Mocked<IBackgroundCheckRepository>;

const mockAmberAlertRepo = {
  findById: jest.fn(),
  findAll: jest.fn(),
  findActive: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
} as jest.Mocked<IAmberAlertRepository>;

const mockVehicleRepo = {
  findById: jest.fn(),
  findByPlateNumber: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
} as jest.Mocked<IVehicleRepository>;

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    // Create service with mocked repositories
    analyticsService = new AnalyticsService(
      mockCaseRepo,
      mockPersonRepo,
      mockEvidenceRepo,
      mockAuditRepo,
      mockBackgroundCheckRepo,
      mockAmberAlertRepo,
      mockVehicleRepo
    );

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('getOfficerProductivity', () => {
    it('should return officer productivity metrics with valid date range', async () => {
      // Arrange
      const officerId = 'officer-123';
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      const mockCases = [
        new Case(
          'case-1',
          'HQ-2025-000001',
          'Test Case 1',
          'Description 1',
          'theft',
          'minor',
          'closed',
          new Date('2025-01-05'),
          new Date('2025-01-15'),
          'Location 1',
          'station-hq',
          officerId,
          new Date('2025-01-05'),
          new Date('2025-01-15')
        ),
        new Case(
          'case-2',
          'HQ-2025-000002',
          'Test Case 2',
          'Description 2',
          'assault',
          'major',
          'investigating',
          new Date('2025-01-10'),
          null,
          'Location 2',
          'station-hq',
          officerId,
          new Date('2025-01-10'),
          new Date('2025-01-10')
        ),
      ];

      mockCaseRepo.findByOfficerId.mockResolvedValue(mockCases);
      mockEvidenceRepo.count.mockResolvedValue(5);
      mockBackgroundCheckRepo.count.mockResolvedValue(3);

      // Act
      const result = await analyticsService.getOfficerProductivity(
        officerId,
        startDate,
        endDate
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.officerId).toBe(officerId);
      expect(result.metrics.totalCases).toBe(2);
      expect(result.metrics.activeCases).toBe(1);
      expect(result.metrics.closedCases).toBe(1);
      expect(result.metrics.evidenceCollected).toBe(5);
      expect(result.metrics.backgroundChecksPerformed).toBe(3);
      expect(result.metrics.casesByCategory).toHaveLength(2);
      expect(result.metrics.activityTimeline).toBeDefined();

      expect(mockCaseRepo.findByOfficerId).toHaveBeenCalledWith(officerId);
    });

    it('should handle officer with no cases', async () => {
      // Arrange
      const officerId = 'officer-new';
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      mockCaseRepo.findByOfficerId.mockResolvedValue([]);
      mockEvidenceRepo.count.mockResolvedValue(0);
      mockBackgroundCheckRepo.count.mockResolvedValue(0);

      // Act
      const result = await analyticsService.getOfficerProductivity(
        officerId,
        startDate,
        endDate
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.metrics.totalCases).toBe(0);
      expect(result.metrics.activeCases).toBe(0);
      expect(result.metrics.closedCases).toBe(0);
      expect(result.metrics.evidenceCollected).toBe(0);
    });

    it('should calculate average resolution days correctly', async () => {
      // Arrange
      const officerId = 'officer-123';
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      // Case 1: 10 days to resolve (Jan 1 to Jan 11)
      const case1 = new Case(
        'case-1',
        'HQ-2025-000001',
        'Test Case 1',
        'Description 1',
        'theft',
        'minor',
        'closed',
        new Date('2025-01-01'),
        new Date('2025-01-11'),
        'Location 1',
        'station-hq',
        officerId,
        new Date('2025-01-01'),
        new Date('2025-01-11')
      );

      // Case 2: 20 days to resolve (Jan 1 to Jan 21)
      const case2 = new Case(
        'case-2',
        'HQ-2025-000002',
        'Test Case 2',
        'Description 2',
        'assault',
        'major',
        'closed',
        new Date('2025-01-01'),
        new Date('2025-01-21'),
        'Location 2',
        'station-hq',
        officerId,
        new Date('2025-01-01'),
        new Date('2025-01-21')
      );

      mockCaseRepo.findByOfficerId.mockResolvedValue([case1, case2]);
      mockEvidenceRepo.count.mockResolvedValue(0);
      mockBackgroundCheckRepo.count.mockResolvedValue(0);

      // Act
      const result = await analyticsService.getOfficerProductivity(
        officerId,
        startDate,
        endDate
      );

      // Assert
      // Average should be 15 days (10 + 20) / 2
      expect(result.metrics.averageResolutionDays).toBe(15);
    });

    it('should throw error for invalid date range', async () => {
      // Arrange
      const officerId = 'officer-123';
      const startDate = new Date('2025-01-31');
      const endDate = new Date('2025-01-01'); // End before start

      // Act & Assert
      await expect(
        analyticsService.getOfficerProductivity(officerId, startDate, endDate)
      ).rejects.toThrow('End date must be after start date');

      expect(mockCaseRepo.findByOfficerId).not.toHaveBeenCalled();
    });
  });

  describe('getCaseTrends', () => {
    it('should return case trends with timeline data', async () => {
      // Arrange
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      const stationId = 'station-hq';

      const mockCases = [
        new Case(
          'case-1',
          'HQ-2025-000001',
          'Test Case 1',
          'Description 1',
          'theft',
          'minor',
          'investigating',
          new Date('2025-01-05'),
          null,
          'Location 1',
          stationId,
          'officer-1',
          new Date('2025-01-05'),
          new Date('2025-01-05')
        ),
        new Case(
          'case-2',
          'HQ-2025-000002',
          'Test Case 2',
          'Description 2',
          'theft',
          'major',
          'closed',
          new Date('2025-01-10'),
          new Date('2025-01-20'),
          'Location 2',
          stationId,
          'officer-2',
          new Date('2025-01-10'),
          new Date('2025-01-20')
        ),
        new Case(
          'case-3',
          'HQ-2025-000003',
          'Test Case 3',
          'Description 3',
          'assault',
          'critical',
          'open',
          new Date('2025-01-15'),
          null,
          'Location 3',
          stationId,
          'officer-1',
          new Date('2025-01-15'),
          new Date('2025-01-15')
        ),
      ];

      mockCaseRepo.findAll.mockResolvedValue(mockCases);

      // Act
      const result = await analyticsService.getCaseTrends(
        startDate,
        endDate,
        stationId
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.dateRange.startDate).toEqual(startDate);
      expect(result.dateRange.endDate).toEqual(endDate);
      expect(result.timeline).toBeDefined();
      expect(result.timeline.length).toBeGreaterThan(0);
      expect(result.categoryBreakdown).toHaveLength(2); // theft and assault
      expect(result.severityBreakdown).toHaveLength(3); // minor, major, critical
      expect(result.resolutionMetrics).toBeDefined();
      expect(result.resolutionMetrics.resolutionRate).toBeCloseTo(33.33, 1); // 1/3 closed
    });

    it('should calculate resolution metrics correctly', async () => {
      // Arrange
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      // Case 1: Resolved in 10 days
      const case1 = new Case(
        'case-1',
        'HQ-2025-000001',
        'Test Case 1',
        'Description 1',
        'theft',
        'minor',
        'closed',
        new Date('2025-01-01'),
        new Date('2025-01-11'),
        'Location 1',
        'station-hq',
        'officer-1',
        new Date('2025-01-01'),
        new Date('2025-01-11')
      );

      // Case 2: Resolved in 5 days
      const case2 = new Case(
        'case-2',
        'HQ-2025-000002',
        'Test Case 2',
        'Description 2',
        'theft',
        'minor',
        'closed',
        new Date('2025-01-01'),
        new Date('2025-01-06'),
        'Location 2',
        'station-hq',
        'officer-1',
        new Date('2025-01-01'),
        new Date('2025-01-06')
      );

      // Case 3: Not resolved
      const case3 = new Case(
        'case-3',
        'HQ-2025-000003',
        'Test Case 3',
        'Description 3',
        'theft',
        'minor',
        'open',
        new Date('2025-01-01'),
        null,
        'Location 3',
        'station-hq',
        'officer-1',
        new Date('2025-01-01'),
        new Date('2025-01-01')
      );

      mockCaseRepo.findAll.mockResolvedValue([case1, case2, case3]);

      // Act
      const result = await analyticsService.getCaseTrends(startDate, endDate);

      // Assert
      expect(result.resolutionMetrics.averageResolutionDays).toBe(7.5); // (10+5)/2
      expect(result.resolutionMetrics.medianResolutionDays).toBe(7.5); // Median of [5, 10]
      expect(result.resolutionMetrics.resolutionRate).toBeCloseTo(66.67, 1); // 2/3 closed
    });

    it('should handle empty case list', async () => {
      // Arrange
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      mockCaseRepo.findAll.mockResolvedValue([]);

      // Act
      const result = await analyticsService.getCaseTrends(startDate, endDate);

      // Assert
      expect(result).toBeDefined();
      expect(result.timeline).toBeDefined();
      expect(result.categoryBreakdown).toHaveLength(0);
      expect(result.severityBreakdown).toHaveLength(0);
      expect(result.resolutionMetrics.averageResolutionDays).toBe(0);
      expect(result.resolutionMetrics.resolutionRate).toBe(0);
    });
  });

  describe('getStationPerformance', () => {
    it('should return station performance metrics', async () => {
      // Arrange
      const stationId = 'station-hq';
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      const mockCases = [
        new Case(
          'case-1',
          'HQ-2025-000001',
          'Test Case 1',
          'Description 1',
          'theft',
          'minor',
          'closed',
          new Date('2025-01-05'),
          new Date('2025-01-15'),
          'Location 1',
          stationId,
          'officer-1',
          new Date('2025-01-05'),
          new Date('2025-01-15')
        ),
      ];

      mockCaseRepo.findByStationId.mockResolvedValue(mockCases);
      mockEvidenceRepo.count.mockResolvedValue(10);
      mockBackgroundCheckRepo.count.mockResolvedValue(5);

      // Act
      const result = await analyticsService.getStationPerformance(
        stationId,
        startDate,
        endDate
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.stationId).toBe(stationId);
      expect(result.metrics).toBeDefined();
      expect(result.metrics.totalCases).toBe(1);
      expect(result.metrics.evidenceCollected).toBe(10);
      expect(result.metrics.backgroundChecks).toBe(5);
    });
  });

  describe('getNationalStatistics', () => {
    it('should return national statistics', async () => {
      // Arrange
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      const mockCases = [
        new Case(
          'case-1',
          'HQ-2025-000001',
          'Test Case 1',
          'Description 1',
          'theft',
          'minor',
          'open',
          new Date('2025-01-05'),
          null,
          'Location 1',
          'station-hq',
          'officer-1',
          new Date('2025-01-05'),
          new Date('2025-01-05')
        ),
      ];

      mockCaseRepo.findAll.mockResolvedValue(mockCases);
      mockCaseRepo.count.mockResolvedValue(1);
      mockPersonRepo.count.mockResolvedValue(50);
      mockEvidenceRepo.count.mockResolvedValue(100);
      mockAmberAlertRepo.count.mockResolvedValue(2);
      mockVehicleRepo.count.mockResolvedValue(5);

      // Act
      const result = await analyticsService.getNationalStatistics(
        startDate,
        endDate
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.overview).toBeDefined();
      expect(result.overview.totalCases).toBe(1);
      expect(result.overview.totalPersons).toBe(50);
      expect(result.overview.totalEvidence).toBe(100);
      expect(result.alerts).toBeDefined();
      expect(result.alerts.activeAlerts).toBe(2);
      expect(result.alerts.stolenVehicles).toBe(5);
    });
  });
});

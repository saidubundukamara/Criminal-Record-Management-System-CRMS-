/**
 * ReportService Unit Tests
 *
 * Tests for Report generation business logic with mocked repositories
 * Phase 8: Dashboards & Reporting
 */
import { ReportService } from '@/src/services/ReportService';
import { ICaseRepository } from '@/src/domain/interfaces/repositories/ICaseRepository';
import { IPersonRepository } from '@/src/domain/interfaces/repositories/IPersonRepository';
import { IEvidenceRepository } from '@/src/domain/interfaces/repositories/IEvidenceRepository';
import { IAuditLogRepository } from '@/src/domain/interfaces/repositories/IAuditLogRepository';
import { Case } from '@/src/domain/entities/Case';
import { Evidence } from '@/src/domain/entities/Evidence';
import { NotFoundError, ValidationError } from '@/src/lib/errors';

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

describe('ReportService', () => {
  let reportService: ReportService;

  beforeEach(() => {
    // Create service with mocked repositories
    reportService = new ReportService(
      mockCaseRepo,
      mockPersonRepo,
      mockEvidenceRepo,
      mockAuditRepo
    );

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('generateCaseReport', () => {
    it('should generate case report with complete data', async () => {
      // Arrange
      const caseId = 'case-123';
      const mockCase = new Case(
        caseId,
        'HQ-2025-000001',
        'Theft Case Report',
        'Description of theft case',
        'theft',
        'major',
        'investigating',
        new Date('2025-01-05'),
        null,
        'Downtown Location',
        'station-hq',
        'officer-123',
        new Date('2025-01-05'),
        new Date('2025-01-10')
      );

      const mockEvidence = [
        new Evidence(
          'evidence-1',
          caseId,
          'Evidence 1',
          'physical',
          'storage',
          'EVD-001',
          'station-hq',
          'officer-123',
          false,
          false,
          null,
          [],
          new Date('2025-01-05'),
          new Date('2025-01-05')
        ),
      ];

      const mockAuditLogs = [
        {
          id: 'audit-1',
          entityType: 'case',
          entityId: caseId,
          officerId: 'officer-123',
          action: 'create',
          success: true,
          details: {},
          stationId: 'station-hq',
          ipAddress: '192.168.1.1',
          createdAt: new Date('2025-01-05'),
        },
      ];

      mockCaseRepo.findById.mockResolvedValue(mockCase);
      mockEvidenceRepo.findByCaseId.mockResolvedValue(mockEvidence);
      mockAuditRepo.findByEntityId.mockResolvedValue(mockAuditLogs);

      // Act
      const result = await reportService.generateCaseReport(caseId);

      // Assert
      expect(result).toBeDefined();
      expect(result.case).toEqual(mockCase);
      expect(result.evidence).toHaveLength(1);
      expect(result.auditTrail).toBeDefined();
      expect(result.chainOfCustody).toBeDefined();

      expect(mockCaseRepo.findById).toHaveBeenCalledWith(caseId);
      expect(mockEvidenceRepo.findByCaseId).toHaveBeenCalledWith(caseId);
      expect(mockAuditRepo.findByEntityId).toHaveBeenCalledWith('case', caseId);
    });

    it('should throw NotFoundError for non-existent case', async () => {
      // Arrange
      const caseId = 'non-existent-case';
      mockCaseRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        reportService.generateCaseReport(caseId)
      ).rejects.toThrow(NotFoundError);
      await expect(
        reportService.generateCaseReport(caseId)
      ).rejects.toThrow('Case not found');

      expect(mockCaseRepo.findById).toHaveBeenCalledWith(caseId);
      expect(mockEvidenceRepo.findByCaseId).not.toHaveBeenCalled();
    });

    it('should handle case with no evidence', async () => {
      // Arrange
      const caseId = 'case-123';
      const mockCase = new Case(
        caseId,
        'HQ-2025-000001',
        'Case without Evidence',
        'Description',
        'theft',
        'minor',
        'open',
        new Date('2025-01-05'),
        null,
        'Location',
        'station-hq',
        'officer-123',
        new Date('2025-01-05'),
        new Date('2025-01-05')
      );

      mockCaseRepo.findById.mockResolvedValue(mockCase);
      mockEvidenceRepo.findByCaseId.mockResolvedValue([]);
      mockAuditRepo.findByEntityId.mockResolvedValue([]);

      // Act
      const result = await reportService.generateCaseReport(caseId);

      // Assert
      expect(result).toBeDefined();
      expect(result.case).toEqual(mockCase);
      expect(result.evidence).toHaveLength(0);
      expect(result.chainOfCustody).toHaveLength(0);
    });
  });

  describe('generateStationReport', () => {
    it('should generate station report with valid date range', async () => {
      // Arrange
      const stationId = 'station-hq';
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      const mockCases = [
        new Case(
          'case-1',
          'HQ-2025-000001',
          'Case 1',
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
        new Case(
          'case-2',
          'HQ-2025-000002',
          'Case 2',
          'Description 2',
          'assault',
          'major',
          'investigating',
          new Date('2025-01-10'),
          null,
          'Location 2',
          stationId,
          'officer-2',
          new Date('2025-01-10'),
          new Date('2025-01-10')
        ),
      ];

      mockCaseRepo.findByStationId.mockResolvedValue(mockCases);
      mockEvidenceRepo.count.mockResolvedValue(10);

      // Act
      const result = await reportService.generateStationReport(
        stationId,
        startDate,
        endDate
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.station.id).toBe(stationId);
      expect(result.period.startDate).toEqual(startDate);
      expect(result.period.endDate).toEqual(endDate);
      expect(result.metrics.totalCases).toBe(2);
      expect(result.metrics.casesOpened).toBe(2);
      expect(result.metrics.casesClosed).toBe(1);
      expect(result.metrics.resolutionRate).toBe(50); // 1/2 closed
      expect(result.metrics.evidenceCollected).toBe(10);
      expect(result.casesByCategory).toBeDefined();
      expect(result.casesBySeverity).toBeDefined();

      expect(mockCaseRepo.findByStationId).toHaveBeenCalledWith(stationId);
    });

    it('should throw ValidationError for invalid date range', async () => {
      // Arrange
      const stationId = 'station-hq';
      const startDate = new Date('2025-01-31');
      const endDate = new Date('2025-01-01'); // End before start

      // Act & Assert
      await expect(
        reportService.generateStationReport(stationId, startDate, endDate)
      ).rejects.toThrow(ValidationError);
      await expect(
        reportService.generateStationReport(stationId, startDate, endDate)
      ).rejects.toThrow('End date must be after start date');

      expect(mockCaseRepo.findByStationId).not.toHaveBeenCalled();
    });

    it('should calculate average resolution days correctly', async () => {
      // Arrange
      const stationId = 'station-hq';
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      // Case 1: 10 days to resolve
      const case1 = new Case(
        'case-1',
        'HQ-2025-000001',
        'Case 1',
        'Description 1',
        'theft',
        'minor',
        'closed',
        new Date('2025-01-01'),
        new Date('2025-01-11'),
        'Location 1',
        stationId,
        'officer-1',
        new Date('2025-01-01'),
        new Date('2025-01-11')
      );

      // Case 2: 20 days to resolve
      const case2 = new Case(
        'case-2',
        'HQ-2025-000002',
        'Case 2',
        'Description 2',
        'assault',
        'major',
        'closed',
        new Date('2025-01-01'),
        new Date('2025-01-21'),
        'Location 2',
        stationId,
        'officer-2',
        new Date('2025-01-01'),
        new Date('2025-01-21')
      );

      mockCaseRepo.findByStationId.mockResolvedValue([case1, case2]);
      mockEvidenceRepo.count.mockResolvedValue(0);

      // Act
      const result = await reportService.generateStationReport(
        stationId,
        startDate,
        endDate
      );

      // Assert
      expect(result.metrics.averageResolutionDays).toBe(15); // (10 + 20) / 2
    });
  });

  describe('generateComplianceReport', () => {
    it('should generate GDPR compliance report', async () => {
      // Arrange
      const reportType = 'gdpr';
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');

      mockAuditRepo.count.mockResolvedValue(1000);
      mockCaseRepo.count.mockResolvedValue(100);

      // Act
      const result = await reportService.generateComplianceReport(
        reportType,
        startDate,
        endDate
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.reportType).toBe('gdpr');
      expect(result.period.startDate).toEqual(startDate);
      expect(result.period.endDate).toEqual(endDate);
      expect(result.auditMetrics).toBeDefined();
      expect(result.dataProtectionCompliance).toBeDefined();
    });

    it('should generate Malabo Convention compliance report', async () => {
      // Arrange
      const reportType = 'malabo';
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');

      mockAuditRepo.count.mockResolvedValue(500);
      mockCaseRepo.count.mockResolvedValue(50);

      // Act
      const result = await reportService.generateComplianceReport(
        reportType,
        startDate,
        endDate
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.reportType).toBe('malabo');
      expect(result.dataProtectionCompliance).toBeDefined();
    });

    it('should generate Audit compliance report', async () => {
      // Arrange
      const reportType = 'audit';
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');

      mockAuditRepo.count.mockResolvedValue(2000);
      mockAuditRepo.findAll.mockResolvedValue([]);

      // Act
      const result = await reportService.generateComplianceReport(
        reportType,
        startDate,
        endDate
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.reportType).toBe('audit');
      expect(result.auditMetrics).toBeDefined();
      expect(result.auditMetrics.totalAuditLogs).toBe(2000);
    });

    it('should throw ValidationError for invalid report type', async () => {
      // Arrange
      const reportType = 'invalid-type' as any;
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');

      // Act & Assert
      await expect(
        reportService.generateComplianceReport(reportType, startDate, endDate)
      ).rejects.toThrow(ValidationError);
      await expect(
        reportService.generateComplianceReport(reportType, startDate, endDate)
      ).rejects.toThrow('Invalid report type');
    });

    it('should throw ValidationError for invalid date range', async () => {
      // Arrange
      const reportType = 'gdpr';
      const startDate = new Date('2025-12-31');
      const endDate = new Date('2025-01-01'); // End before start

      // Act & Assert
      await expect(
        reportService.generateComplianceReport(reportType, startDate, endDate)
      ).rejects.toThrow(ValidationError);
      await expect(
        reportService.generateComplianceReport(reportType, startDate, endDate)
      ).rejects.toThrow('End date must be after start date');
    });
  });
});

/**
 * CaseService Unit Tests
 *
 * Tests for Case business logic with mocked repositories
 */
import { CaseService } from '@/src/services/CaseService';
import { ICaseRepository } from '@/src/domain/interfaces/repositories/ICaseRepository';
import { IAuditLogRepository } from '@/src/domain/interfaces/repositories/IAuditLogRepository';
import { Case } from '@/src/domain/entities/Case';
import { mockCase, validCreateCaseInput, invalidCaseInput } from '../../fixtures/test-data';

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

const mockAuditRepo = {
  create: jest.fn(),
  findByEntityId: jest.fn(),
  findByOfficerId: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
} as jest.Mocked<IAuditLogRepository>;

describe('CaseService', () => {
  let caseService: CaseService;

  beforeEach(() => {
    // Create service with mocked repositories
    caseService = new CaseService(mockCaseRepo, mockAuditRepo);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('createCase', () => {
    it('should create a case with valid data', async () => {
      // Arrange
      const inputWithIds = {
        ...validCreateCaseInput,
        stationId: 'station-hq',
        officerId: 'officer-123',
      };

      mockCaseRepo.create.mockResolvedValue(mockCase);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act
      const result = await caseService.createCase(
        inputWithIds,
        'officer-123'
      );

      // Assert
      expect(result).toEqual(mockCase);
      expect(mockCaseRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: validCreateCaseInput.title,
          description: validCreateCaseInput.description,
          category: validCreateCaseInput.category,
          severity: validCreateCaseInput.severity,
          location: validCreateCaseInput.location,
          officerId: 'officer-123',
          stationId: 'station-hq',
        })
      );
      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'case',
          entityId: mockCase.id,
          officerId: 'officer-123',
          action: 'create',
          success: true,
        })
      );
    });

    it('should throw error for missing required fields', async () => {
      // Arrange
      const invalidInput = {
        ...validCreateCaseInput,
        title: 'abc', // Less than 5 characters
        stationId: 'station-hq',
        officerId: 'officer-123',
      };

      // Act & Assert
      await expect(
        caseService.createCase(invalidInput, 'officer-123')
      ).rejects.toThrow('Case title must be at least 5 characters');

      expect(mockCaseRepo.create).not.toHaveBeenCalled();
    });

    it('should throw error for future incident date', async () => {
      // Arrange
      const futureDate = new Date(Date.now() + 86400000); // Tomorrow
      const invalidInput = {
        ...validCreateCaseInput,
        incidentDate: futureDate,
        stationId: 'station-hq',
        officerId: 'officer-123',
      };

      // Act & Assert
      await expect(
        caseService.createCase(invalidInput, 'officer-123')
      ).rejects.toThrow('Incident date cannot be in the future');

      expect(mockCaseRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('updateCaseStatus', () => {
    it('should update case status with valid transition', async () => {
      // Arrange
      const openCase = new Case(
        'case-123',
        'HQ-2025-000001',
        'Test Case',
        'Description',
        'theft',
        'minor',
        'open',
        new Date(),
        new Date(),
        'Location',
        'station-hq',
        'officer-123',
        new Date(),
        new Date()
      );

      const updatedCase = new Case(
        'case-123',
        'HQ-2025-000001',
        'Test Case',
        'Description',
        'theft',
        'minor',
        'investigating',
        new Date(),
        new Date(),
        'Location',
        'station-hq',
        'officer-123',
        new Date(),
        new Date()
      );

      mockCaseRepo.findById.mockResolvedValue(openCase);
      mockCaseRepo.updateStatus.mockResolvedValue(updatedCase);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act
      const result = await caseService.updateCaseStatus(
        'case-123',
        'investigating',
        'officer-123'
      );

      // Assert
      expect(result.status).toBe('investigating');
      expect(mockCaseRepo.updateStatus).toHaveBeenCalledWith('case-123', 'investigating');
      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'case',
          entityId: 'case-123',
          action: 'status_change',
          success: true,
          details: expect.objectContaining({
            oldStatus: 'open',
            newStatus: 'investigating',
          }),
        })
      );
    });

    it('should reject invalid status transition', async () => {
      // Arrange
      const closedCase = new Case(
        'case-123',
        'HQ-2025-000001',
        'Test Case',
        'Description',
        'theft',
        'minor',
        'closed',
        new Date(),
        new Date(),
        'Location',
        'station-hq',
        'officer-123',
        new Date(),
        new Date()
      );

      mockCaseRepo.findById.mockResolvedValue(closedCase);

      // Act & Assert
      await expect(
        caseService.updateCaseStatus('case-123', 'open' as any, 'officer-123')
      ).rejects.toThrow('Cannot change status of closed case');

      expect(mockCaseRepo.updateStatus).not.toHaveBeenCalled();
    });

    it('should throw error for non-existent case', async () => {
      // Arrange
      mockCaseRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        caseService.updateCaseStatus('invalid-id', 'investigating', 'officer-123')
      ).rejects.toThrow('Case not found');

      expect(mockCaseRepo.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('getCaseById', () => {
    it('should return case when found', async () => {
      // Arrange
      mockCaseRepo.findById.mockResolvedValue(mockCase);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act
      const result = await caseService.getCaseById('case-123', 'officer-123');

      // Assert
      expect(result).toEqual(mockCase);
      expect(mockCaseRepo.findById).toHaveBeenCalledWith('case-123', false);
      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'case',
          entityId: 'case-123',
          officerId: 'officer-123',
          action: 'read',
          success: true,
        })
      );
    });

    it('should throw error when case not found', async () => {
      // Arrange
      mockCaseRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        caseService.getCaseById('invalid-id', 'officer-123')
      ).rejects.toThrow('Case not found');
    });
  });

  describe('listCases', () => {
    it('should return cases with filters', async () => {
      // Arrange
      const cases = [mockCase];
      const filters = { status: 'open' as any, stationId: 'station-hq' };
      mockCaseRepo.findAll.mockResolvedValue(cases);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act
      const result = await caseService.listCases(filters, 'officer-123');

      // Assert
      expect(result).toEqual(cases);
      expect(mockCaseRepo.findAll).toHaveBeenCalledWith(filters);
      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'case',
          officerId: 'officer-123',
          action: 'read',
          success: true,
        })
      );
    });
  });

  describe('updateCase', () => {
    it('should update case with valid data', async () => {
      // Arrange
      const openCase = new Case(
        'case-123',
        'HQ-2025-000001',
        'Test Case',
        'Description',
        'theft',
        'minor',
        'open',
        new Date(),
        new Date(),
        'Location',
        'station-hq',
        'officer-123',
        new Date(),
        new Date()
      );

      const updateData = { title: 'Updated Title', description: 'Updated Description' };

      mockCaseRepo.findById.mockResolvedValue(openCase);
      mockCaseRepo.update.mockResolvedValue({ ...openCase, ...updateData } as any);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act
      const result = await caseService.updateCase('case-123', updateData, 'officer-123');

      // Assert
      expect(result.title).toBe('Updated Title');
      expect(mockCaseRepo.update).toHaveBeenCalledWith('case-123', expect.objectContaining({
        title: 'Updated Title',
        description: 'Updated Description',
      }));
      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'case',
          entityId: 'case-123',
          action: 'update',
          success: true,
        })
      );
    });

    it('should reject updating closed case', async () => {
      // Arrange
      const closedCase = new Case(
        'case-123',
        'HQ-2025-000001',
        'Test Case',
        'Description',
        'theft',
        'minor',
        'closed',
        new Date(),
        new Date(),
        'Location',
        'station-hq',
        'officer-123',
        new Date(),
        new Date()
      );

      mockCaseRepo.findById.mockResolvedValue(closedCase);

      // Act & Assert
      await expect(
        caseService.updateCase('case-123', { title: 'New Title' }, 'officer-123')
      ).rejects.toThrow('Cannot update a closed case');

      expect(mockCaseRepo.update).not.toHaveBeenCalled();
    });
  });
});

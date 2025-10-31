/**
 * EvidenceService Unit Tests
 *
 * Tests for Evidence business logic with mocked repositories
 */
import { EvidenceService } from '@/src/services/EvidenceService';
import { IEvidenceRepository } from '@/src/domain/interfaces/repositories/IEvidenceRepository';
import { IAuditLogRepository } from '@/src/domain/interfaces/repositories/IAuditLogRepository';
import { Evidence } from '@/src/domain/entities/Evidence';
import { mockEvidence, validCreateEvidenceInput } from '../../fixtures/test-data';

// Mock repositories
const mockEvidenceRepo = {
  findById: jest.fn(),
  findByIdWithCase: jest.fn(),
  findByQRCode: jest.fn(),
  findByCaseId: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateStatus: jest.fn(),
  delete: jest.fn(),
  generateQRCode: jest.fn(),
  addCustodyEvent: jest.fn(),
  sealEvidence: jest.fn(),
  getStatistics: jest.fn(),
  getStaleEvidence: jest.fn(),
  getCriticalEvidence: jest.fn(),
} as jest.Mocked<IEvidenceRepository>;

const mockAuditRepo = {
  create: jest.fn(),
  findByEntityId: jest.fn(),
  findByOfficerId: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
} as jest.Mocked<IAuditLogRepository>;

describe('EvidenceService', () => {
  let evidenceService: EvidenceService;

  beforeEach(() => {
    // Create service with mocked repositories
    evidenceService = new EvidenceService(mockEvidenceRepo, mockAuditRepo);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('createEvidence', () => {
    it('should create evidence with valid data', async () => {
      // Arrange
      const officerDetails = { name: 'Test Officer', badge: 'SA-00001' };
      mockEvidenceRepo.generateQRCode.mockResolvedValue('HQ-EV-2025-000001');
      mockEvidenceRepo.create.mockResolvedValue(mockEvidence);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act
      const result = await evidenceService.createEvidence(
        validCreateEvidenceInput,
        'officer-123',
        'station-hq',
        officerDetails
      );

      // Assert
      expect(result).toEqual(mockEvidence);
      expect(mockEvidenceRepo.generateQRCode).toHaveBeenCalledWith('station-hq');
      expect(mockEvidenceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          qrCode: 'HQ-EV-2025-000001',
          caseId: validCreateEvidenceInput.caseId,
          type: validCreateEvidenceInput.type,
          description: validCreateEvidenceInput.description,
          collectedBy: 'officer-123',
          stationId: 'station-hq',
          chainOfCustody: expect.arrayContaining([
            expect.objectContaining({
              officerId: 'officer-123',
              action: 'collected',
            }),
          ]),
        })
      );
      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'evidence',
          entityId: mockEvidence.id,
          officerId: 'officer-123',
          action: 'create',
          success: true,
        })
      );
    });

    it('should throw error for description too short', async () => {
      // Arrange
      const invalidInput = {
        ...validCreateEvidenceInput,
        description: 'Short', // Less than 10 characters
      };

      // Act & Assert
      await expect(
        evidenceService.createEvidence(
          invalidInput,
          'officer-123',
          'station-hq',
          { name: 'Test Officer', badge: 'SA-00001' }
        )
      ).rejects.toThrow('Description must be between 10 and 1000 characters');

      expect(mockEvidenceRepo.create).not.toHaveBeenCalled();
    });

    it('should throw error for invalid evidence type', async () => {
      // Arrange
      const invalidInput = {
        ...validCreateEvidenceInput,
        type: 'invalid' as any,
      };

      // Act & Assert
      await expect(
        evidenceService.createEvidence(
          invalidInput,
          'officer-123',
          'station-hq',
          { name: 'Test Officer', badge: 'SA-00001' }
        )
      ).rejects.toThrow('Invalid evidence type');

      expect(mockEvidenceRepo.create).not.toHaveBeenCalled();
    });

    it('should throw error for invalid tag length', async () => {
      // Arrange
      const invalidInput = {
        ...validCreateEvidenceInput,
        tags: ['a'], // Less than 2 characters
      };

      // Act & Assert
      await expect(
        evidenceService.createEvidence(
          invalidInput,
          'officer-123',
          'station-hq',
          { name: 'Test Officer', badge: 'SA-00001' }
        )
      ).rejects.toThrow('Each tag must be between 2 and 30 characters');

      expect(mockEvidenceRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('updateEvidence', () => {
    it('should update evidence with valid data', async () => {
      // Arrange
      const updateData = {
        description: 'Updated description for evidence',
        tags: ['updated', 'evidence'],
      };

      const updatedEvidence = new Evidence(
        mockEvidence.id,
        mockEvidence.qrCode,
        mockEvidence.caseId,
        mockEvidence.type,
        'Updated description for evidence',
        mockEvidence.status,
        mockEvidence.collectedDate,
        mockEvidence.collectedLocation,
        mockEvidence.collectedBy,
        mockEvidence.fileUrl,
        mockEvidence.fileKey,
        mockEvidence.fileName,
        mockEvidence.fileSize,
        mockEvidence.fileMimeType,
        mockEvidence.fileHash,
        mockEvidence.storageLocation,
        mockEvidence.chainOfCustody,
        ['updated', 'evidence'],
        mockEvidence.notes,
        mockEvidence.isSealed,
        mockEvidence.sealedAt,
        mockEvidence.sealedBy,
        mockEvidence.stationId,
        mockEvidence.createdAt,
        new Date()
      );

      mockEvidenceRepo.findById.mockResolvedValue(mockEvidence);
      mockEvidenceRepo.update.mockResolvedValue(updatedEvidence);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act
      const result = await evidenceService.updateEvidence(
        'evidence-123',
        updateData,
        'officer-123'
      );

      // Assert
      expect(result.description).toBe('Updated description for evidence');
      expect(result.tags).toEqual(['updated', 'evidence']);
      expect(mockEvidenceRepo.update).toHaveBeenCalledWith(
        'evidence-123',
        expect.objectContaining({
          description: 'Updated description for evidence',
          tags: ['updated', 'evidence'],
        })
      );
      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'evidence',
          entityId: 'evidence-123',
          action: 'update',
          success: true,
        })
      );
    });

    it('should throw error when evidence not found', async () => {
      // Arrange
      mockEvidenceRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        evidenceService.updateEvidence(
          'invalid-id',
          { description: 'Test description updated' },
          'officer-123'
        )
      ).rejects.toThrow('Evidence not found');

      expect(mockEvidenceRepo.update).not.toHaveBeenCalled();
    });

    it('should throw error when updating destroyed evidence', async () => {
      // Arrange
      const destroyedEvidence = new Evidence(
        mockEvidence.id,
        mockEvidence.qrCode,
        mockEvidence.caseId,
        mockEvidence.type,
        mockEvidence.description,
        'destroyed',
        mockEvidence.collectedDate,
        mockEvidence.collectedLocation,
        mockEvidence.collectedBy,
        mockEvidence.fileUrl,
        mockEvidence.fileKey,
        mockEvidence.fileName,
        mockEvidence.fileSize,
        mockEvidence.fileMimeType,
        mockEvidence.fileHash,
        mockEvidence.storageLocation,
        mockEvidence.chainOfCustody,
        mockEvidence.tags,
        mockEvidence.notes,
        mockEvidence.isSealed,
        mockEvidence.sealedAt,
        mockEvidence.sealedBy,
        mockEvidence.stationId,
        mockEvidence.createdAt,
        mockEvidence.updatedAt
      );

      mockEvidenceRepo.findById.mockResolvedValue(destroyedEvidence);

      // Act & Assert
      await expect(
        evidenceService.updateEvidence(
          'evidence-123',
          { description: 'Test description updated' },
          'officer-123'
        )
      ).rejects.toThrow('Cannot update destroyed evidence');

      expect(mockEvidenceRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteEvidence', () => {
    it('should delete evidence in collected status', async () => {
      // Arrange
      mockEvidenceRepo.findById.mockResolvedValue(mockEvidence); // status = collected
      mockEvidenceRepo.delete.mockResolvedValue(undefined);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act
      await evidenceService.deleteEvidence('evidence-123', 'officer-123');

      // Assert
      expect(mockEvidenceRepo.delete).toHaveBeenCalledWith('evidence-123');
      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'evidence',
          entityId: 'evidence-123',
          action: 'delete',
          success: true,
        })
      );
    });

    it('should throw error when evidence not found', async () => {
      // Arrange
      mockEvidenceRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        evidenceService.deleteEvidence('invalid-id', 'officer-123')
      ).rejects.toThrow('Evidence not found');

      expect(mockEvidenceRepo.delete).not.toHaveBeenCalled();
    });

    it('should throw error when deleting evidence in court', async () => {
      // Arrange
      const courtEvidence = new Evidence(
        mockEvidence.id,
        mockEvidence.qrCode,
        mockEvidence.caseId,
        mockEvidence.type,
        mockEvidence.description,
        'court',
        mockEvidence.collectedDate,
        mockEvidence.collectedLocation,
        mockEvidence.collectedBy,
        mockEvidence.fileUrl,
        mockEvidence.fileKey,
        mockEvidence.fileName,
        mockEvidence.fileSize,
        mockEvidence.fileMimeType,
        mockEvidence.fileHash,
        mockEvidence.storageLocation,
        mockEvidence.chainOfCustody,
        mockEvidence.tags,
        mockEvidence.notes,
        mockEvidence.isSealed,
        mockEvidence.sealedAt,
        mockEvidence.sealedBy,
        mockEvidence.stationId,
        mockEvidence.createdAt,
        mockEvidence.updatedAt
      );

      mockEvidenceRepo.findById.mockResolvedValue(courtEvidence);

      // Act & Assert
      await expect(
        evidenceService.deleteEvidence('evidence-123', 'officer-123')
      ).rejects.toThrow('Can only delete evidence in collected or stored status');

      expect(mockEvidenceRepo.delete).not.toHaveBeenCalled();
    });
  });

  describe('getEvidenceById', () => {
    it('should return evidence when found', async () => {
      // Arrange
      mockEvidenceRepo.findById.mockResolvedValue(mockEvidence);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act
      const result = await evidenceService.getEvidenceById('evidence-123', 'officer-123');

      // Assert
      expect(result).toEqual(mockEvidence);
      expect(mockEvidenceRepo.findById).toHaveBeenCalledWith('evidence-123');
      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'evidence',
          entityId: 'evidence-123',
          officerId: 'officer-123',
          action: 'read',
          success: true,
        })
      );
    });

    it('should throw error when evidence not found', async () => {
      // Arrange
      mockEvidenceRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        evidenceService.getEvidenceById('invalid-id', 'officer-123')
      ).rejects.toThrow('Evidence not found');
    });
  });

  describe('getEvidenceByQRCode', () => {
    it('should return evidence when found', async () => {
      // Arrange
      mockEvidenceRepo.findByQRCode.mockResolvedValue(mockEvidence);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act
      const result = await evidenceService.getEvidenceByQRCode(
        'HQ-EV-2025-000001',
        'officer-123'
      );

      // Assert
      expect(result).toEqual(mockEvidence);
      expect(mockEvidenceRepo.findByQRCode).toHaveBeenCalledWith('HQ-EV-2025-000001');
      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'evidence',
          entityId: mockEvidence.id,
          officerId: 'officer-123',
          action: 'read',
          success: true,
          details: expect.objectContaining({
            scanType: 'qr',
            qrCode: 'HQ-EV-2025-000001',
          }),
        })
      );
    });

    it('should return null when not found', async () => {
      // Arrange
      mockEvidenceRepo.findByQRCode.mockResolvedValue(null);

      // Act
      const result = await evidenceService.getEvidenceByQRCode(
        'INVALID-QR',
        'officer-123'
      );

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('updateEvidenceStatus', () => {
    it('should update status with valid transition', async () => {
      // Arrange
      const storedEvidence = new Evidence(
        mockEvidence.id,
        mockEvidence.qrCode,
        mockEvidence.caseId,
        mockEvidence.type,
        mockEvidence.description,
        'stored',
        mockEvidence.collectedDate,
        mockEvidence.collectedLocation,
        mockEvidence.collectedBy,
        mockEvidence.fileUrl,
        mockEvidence.fileKey,
        mockEvidence.fileName,
        mockEvidence.fileSize,
        mockEvidence.fileMimeType,
        mockEvidence.fileHash,
        mockEvidence.storageLocation,
        mockEvidence.chainOfCustody,
        mockEvidence.tags,
        mockEvidence.notes,
        mockEvidence.isSealed,
        mockEvidence.sealedAt,
        mockEvidence.sealedBy,
        mockEvidence.stationId,
        mockEvidence.createdAt,
        mockEvidence.updatedAt
      );

      mockEvidenceRepo.findById.mockResolvedValue(mockEvidence); // status = collected
      mockEvidenceRepo.updateStatus.mockResolvedValue(storedEvidence);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act
      const result = await evidenceService.updateEvidenceStatus(
        'evidence-123',
        'stored',
        'officer-123',
        'Moved to evidence storage'
      );

      // Assert
      expect(result.status).toBe('stored');
      expect(mockEvidenceRepo.updateStatus).toHaveBeenCalledWith('evidence-123', 'stored');
      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'update',
          details: expect.objectContaining({
            previousStatus: 'collected',
            newStatus: 'stored',
            reason: 'Moved to evidence storage',
          }),
        })
      );
    });

    it('should throw error for invalid status transition', async () => {
      // Arrange
      const destroyedEvidence = new Evidence(
        mockEvidence.id,
        mockEvidence.qrCode,
        mockEvidence.caseId,
        mockEvidence.type,
        mockEvidence.description,
        'destroyed',
        mockEvidence.collectedDate,
        mockEvidence.collectedLocation,
        mockEvidence.collectedBy,
        mockEvidence.fileUrl,
        mockEvidence.fileKey,
        mockEvidence.fileName,
        mockEvidence.fileSize,
        mockEvidence.fileMimeType,
        mockEvidence.fileHash,
        mockEvidence.storageLocation,
        mockEvidence.chainOfCustody,
        mockEvidence.tags,
        mockEvidence.notes,
        mockEvidence.isSealed,
        mockEvidence.sealedAt,
        mockEvidence.sealedBy,
        mockEvidence.stationId,
        mockEvidence.createdAt,
        mockEvidence.updatedAt
      );

      mockEvidenceRepo.findById.mockResolvedValue(destroyedEvidence);

      // Act & Assert
      await expect(
        evidenceService.updateEvidenceStatus('evidence-123', 'stored', 'officer-123')
      ).rejects.toThrow('Cannot change status of destroyed evidence');

      expect(mockEvidenceRepo.updateStatus).not.toHaveBeenCalled();
    });

    it('should throw error when evidence not found', async () => {
      // Arrange
      mockEvidenceRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        evidenceService.updateEvidenceStatus('invalid-id', 'stored', 'officer-123')
      ).rejects.toThrow('Evidence not found');

      expect(mockEvidenceRepo.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('addCustodyEvent', () => {
    it('should add custody event successfully', async () => {
      // Arrange
      const newCustodyEvent = {
        action: 'transferred' as const,
        location: 'Evidence Room B',
        notes: 'Transferred for analysis',
      };

      const updatedEvidence = new Evidence(
        mockEvidence.id,
        mockEvidence.qrCode,
        mockEvidence.caseId,
        mockEvidence.type,
        mockEvidence.description,
        mockEvidence.status,
        mockEvidence.collectedDate,
        mockEvidence.collectedLocation,
        mockEvidence.collectedBy,
        mockEvidence.fileUrl,
        mockEvidence.fileKey,
        mockEvidence.fileName,
        mockEvidence.fileSize,
        mockEvidence.fileMimeType,
        mockEvidence.fileHash,
        mockEvidence.storageLocation,
        [
          ...mockEvidence.chainOfCustody,
          {
            officerId: 'officer-456',
            officerName: 'Another Officer',
            officerBadge: 'SA-00002',
            action: 'transferred' as const,
            timestamp: new Date(),
            location: 'Evidence Room B',
            notes: 'Transferred for analysis',
          },
        ],
        mockEvidence.tags,
        mockEvidence.notes,
        mockEvidence.isSealed,
        mockEvidence.sealedAt,
        mockEvidence.sealedBy,
        mockEvidence.stationId,
        mockEvidence.createdAt,
        mockEvidence.updatedAt
      );

      mockEvidenceRepo.findById.mockResolvedValue(mockEvidence);
      mockEvidenceRepo.addCustodyEvent.mockResolvedValue(updatedEvidence);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act
      const result = await evidenceService.addCustodyEvent(
        'evidence-123',
        newCustodyEvent,
        'officer-456',
        { name: 'Another Officer', badge: 'SA-00002' }
      );

      // Assert
      expect(result.chainOfCustody.length).toBe(2);
      expect(mockEvidenceRepo.addCustodyEvent).toHaveBeenCalledWith(
        'evidence-123',
        expect.objectContaining({
          officerId: 'officer-456',
          action: 'transferred',
          location: 'Evidence Room B',
        })
      );
      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'update',
          details: expect.objectContaining({
            custodyAction: 'transferred',
          }),
        })
      );
    });

    it('should throw error when evidence not found', async () => {
      // Arrange
      mockEvidenceRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        evidenceService.addCustodyEvent(
          'invalid-id',
          { action: 'transferred', location: 'Room A' },
          'officer-123',
          { name: 'Test Officer', badge: 'SA-00001' }
        )
      ).rejects.toThrow('Evidence not found');

      expect(mockEvidenceRepo.addCustodyEvent).not.toHaveBeenCalled();
    });
  });

  describe('sealEvidence', () => {
    it('should seal evidence successfully', async () => {
      // Arrange
      const sealedEvidence = new Evidence(
        mockEvidence.id,
        mockEvidence.qrCode,
        mockEvidence.caseId,
        mockEvidence.type,
        mockEvidence.description,
        mockEvidence.status,
        mockEvidence.collectedDate,
        mockEvidence.collectedLocation,
        mockEvidence.collectedBy,
        mockEvidence.fileUrl,
        mockEvidence.fileKey,
        mockEvidence.fileName,
        mockEvidence.fileSize,
        mockEvidence.fileMimeType,
        mockEvidence.fileHash,
        mockEvidence.storageLocation,
        mockEvidence.chainOfCustody,
        mockEvidence.tags,
        mockEvidence.notes,
        true, // isSealed
        new Date(),
        'officer-123',
        mockEvidence.stationId,
        mockEvidence.createdAt,
        mockEvidence.updatedAt
      );

      mockEvidenceRepo.findById.mockResolvedValue(mockEvidence);
      mockEvidenceRepo.sealEvidence.mockResolvedValue(sealedEvidence);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act
      const result = await evidenceService.sealEvidence('evidence-123', 'officer-123');

      // Assert
      expect(result.isSealed).toBe(true);
      expect(mockEvidenceRepo.sealEvidence).toHaveBeenCalledWith('evidence-123', 'officer-123');
      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'update',
          details: expect.objectContaining({
            sealed: true,
          }),
        })
      );
    });

    it('should throw error when evidence already sealed', async () => {
      // Arrange
      const alreadySealed = new Evidence(
        mockEvidence.id,
        mockEvidence.qrCode,
        mockEvidence.caseId,
        mockEvidence.type,
        mockEvidence.description,
        mockEvidence.status,
        mockEvidence.collectedDate,
        mockEvidence.collectedLocation,
        mockEvidence.collectedBy,
        mockEvidence.fileUrl,
        mockEvidence.fileKey,
        mockEvidence.fileName,
        mockEvidence.fileSize,
        mockEvidence.fileMimeType,
        mockEvidence.fileHash,
        mockEvidence.storageLocation,
        mockEvidence.chainOfCustody,
        mockEvidence.tags,
        mockEvidence.notes,
        true, // isSealed
        new Date(),
        'officer-123',
        mockEvidence.stationId,
        mockEvidence.createdAt,
        mockEvidence.updatedAt
      );

      mockEvidenceRepo.findById.mockResolvedValue(alreadySealed);

      // Act & Assert
      await expect(
        evidenceService.sealEvidence('evidence-123', 'officer-123')
      ).rejects.toThrow('Evidence is already sealed');

      expect(mockEvidenceRepo.sealEvidence).not.toHaveBeenCalled();
    });

    it('should throw error when evidence not found', async () => {
      // Arrange
      mockEvidenceRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        evidenceService.sealEvidence('invalid-id', 'officer-123')
      ).rejects.toThrow('Evidence not found');

      expect(mockEvidenceRepo.sealEvidence).not.toHaveBeenCalled();
    });
  });
});

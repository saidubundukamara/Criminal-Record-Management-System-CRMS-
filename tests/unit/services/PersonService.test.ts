/**
 * PersonService Unit Tests
 *
 * Tests for Person business logic with mocked repositories
 */
import { PersonService } from '@/src/services/PersonService';
import { IPersonRepository } from '@/src/domain/interfaces/repositories/IPersonRepository';
import { IAuditLogRepository } from '@/src/domain/interfaces/repositories/IAuditLogRepository';
import { Person } from '@/src/domain/entities/Person';
import { mockPerson, validCreatePersonInput } from '../../fixtures/test-data';

// Mock repositories
const mockPersonRepo = {
  findById: jest.fn(),
  findByIdWithRelations: jest.fn(),
  findByNIN: jest.fn(),
  existsByNIN: jest.fn(),
  findByFingerprintHash: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  markAsWanted: jest.fn(),
  updateRiskLevel: jest.fn(),
  addAlias: jest.fn(),
  removeAlias: jest.fn(),
  getWantedPersons: jest.fn(),
  getHighRiskPersons: jest.fn(),
  getIncompleteRecords: jest.fn(),
  getStatistics: jest.fn(),
  findByCaseId: jest.fn(),
} as jest.Mocked<IPersonRepository>;

const mockAuditRepo = {
  create: jest.fn(),
  findByEntityId: jest.fn(),
  findByOfficerId: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
} as jest.Mocked<IAuditLogRepository>;

describe('PersonService', () => {
  let personService: PersonService;

  beforeEach(() => {
    // Create service with mocked repositories
    personService = new PersonService(mockPersonRepo, mockAuditRepo);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('createPerson', () => {
    it('should create a person with valid data', async () => {
      // Arrange
      mockPersonRepo.existsByNIN.mockResolvedValue(false); // No duplicate
      mockPersonRepo.create.mockResolvedValue(mockPerson);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act
      const result = await personService.createPerson(
        validCreatePersonInput,
        'officer-123'
      );

      // Assert
      expect(result).toEqual(mockPerson);
      expect(mockPersonRepo.existsByNIN).toHaveBeenCalledWith(validCreatePersonInput.nin);
      expect(mockPersonRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nin: validCreatePersonInput.nin,
          firstName: validCreatePersonInput.firstName,
          lastName: validCreatePersonInput.lastName,
          gender: validCreatePersonInput.gender,
          nationality: validCreatePersonInput.nationality,
          createdBy: 'officer-123',
        })
      );
      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'person',
          entityId: mockPerson.id,
          officerId: 'officer-123',
          action: 'create',
          success: true,
        })
      );
    });

    it('should throw error for duplicate NIN', async () => {
      // Arrange
      mockPersonRepo.existsByNIN.mockResolvedValue(true); // NIN exists

      // Act & Assert
      await expect(
        personService.createPerson(validCreatePersonInput, 'officer-123')
      ).rejects.toThrow('Person with NIN 12345678901 already exists');

      expect(mockPersonRepo.create).not.toHaveBeenCalled();
    });

    it('should throw error for firstName too short', async () => {
      // Arrange
      const invalidInput = {
        ...validCreatePersonInput,
        firstName: 'A', // Less than 2 characters
      };

      mockPersonRepo.existsByNIN.mockResolvedValue(false);

      // Act & Assert
      await expect(
        personService.createPerson(invalidInput, 'officer-123')
      ).rejects.toThrow('First name must be between 2 and 50 characters');

      expect(mockPersonRepo.create).not.toHaveBeenCalled();
    });

    it('should throw error for invalid NIN format', async () => {
      // Arrange
      const invalidInput = {
        ...validCreatePersonInput,
        nin: '123', // Invalid format (< 8 chars)
      };

      mockPersonRepo.existsByNIN.mockResolvedValue(false);

      // Act & Assert
      await expect(
        personService.createPerson(invalidInput, 'officer-123')
      ).rejects.toThrow('Invalid NIN format');

      expect(mockPersonRepo.create).not.toHaveBeenCalled();
    });

    it('should throw error for invalid date of birth', async () => {
      // Arrange
      const invalidInput = {
        ...validCreatePersonInput,
        dateOfBirth: '1800-01-01', // Age > 150
      };

      mockPersonRepo.existsByNIN.mockResolvedValue(false);

      // Act & Assert
      await expect(
        personService.createPerson(invalidInput, 'officer-123')
      ).rejects.toThrow('Invalid date of birth');

      expect(mockPersonRepo.create).not.toHaveBeenCalled();
    });

    it('should throw error for invalid gender', async () => {
      // Arrange
      const invalidInput = {
        ...validCreatePersonInput,
        gender: 'invalid' as any,
      };

      mockPersonRepo.existsByNIN.mockResolvedValue(false);

      // Act & Assert
      await expect(
        personService.createPerson(invalidInput, 'officer-123')
      ).rejects.toThrow('Invalid gender');

      expect(mockPersonRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('updatePerson', () => {
    it('should update person with valid data', async () => {
      // Arrange
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      const updatedPerson = new Person(
        'person-123',
        'NIN-123456789',
        'Updated',
        'Name',
        null,
        mockPerson.alias,
        mockPerson.dateOfBirth,
        mockPerson.gender,
        mockPerson.nationality,
        mockPerson.placeOfBirth,
        mockPerson.occupation,
        mockPerson.maritalStatus,
        mockPerson.educationLevel,
        mockPerson.tribe,
        mockPerson.religion,
        mockPerson.languagesSpoken,
        mockPerson.physicalDescription,
        mockPerson.photoUrl,
        mockPerson.addresses,
        mockPerson.phoneNumbers,
        mockPerson.emails,
        mockPerson.fingerprintHash,
        mockPerson.biometricHash,
        mockPerson.criminalHistory,
        mockPerson.riskLevel,
        mockPerson.isWanted,
        mockPerson.isDeceasedOrMissing,
        mockPerson.notes,
        mockPerson.stationId,
        mockPerson.createdBy,
        'officer-123',
        new Date(),
        new Date()
      );

      mockPersonRepo.findById.mockResolvedValue(mockPerson);
      mockPersonRepo.update.mockResolvedValue(updatedPerson);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act
      const result = await personService.updatePerson(
        'person-123',
        updateData,
        'officer-123'
      );

      // Assert
      expect(result.firstName).toBe('Updated');
      expect(result.lastName).toBe('Name');
      expect(mockPersonRepo.update).toHaveBeenCalledWith(
        'person-123',
        expect.objectContaining({
          firstName: 'Updated',
          lastName: 'Name',
          updatedBy: 'officer-123',
        })
      );
      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'person',
          entityId: 'person-123',
          action: 'update',
          success: true,
        })
      );
    });

    it('should throw error when person not found', async () => {
      // Arrange
      mockPersonRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        personService.updatePerson('invalid-id', { firstName: 'Test' }, 'officer-123')
      ).rejects.toThrow('Person not found');

      expect(mockPersonRepo.update).not.toHaveBeenCalled();
    });

    it('should throw error when updating to duplicate NIN', async () => {
      // Arrange
      mockPersonRepo.findById.mockResolvedValue(mockPerson);
      mockPersonRepo.existsByNIN.mockResolvedValue(true); // NIN already exists

      // Act & Assert
      await expect(
        personService.updatePerson(
          'person-123',
          { nin: '99999999999' },
          'officer-123'
        )
      ).rejects.toThrow('Person with NIN 99999999999 already exists');

      expect(mockPersonRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('getPersonById', () => {
    it('should return person when found', async () => {
      // Arrange
      mockPersonRepo.findById.mockResolvedValue(mockPerson);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act
      const result = await personService.getPersonById('person-123', 'officer-123');

      // Assert
      expect(result).toEqual(mockPerson);
      expect(mockPersonRepo.findById).toHaveBeenCalledWith('person-123');
      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'person',
          entityId: 'person-123',
          officerId: 'officer-123',
          action: 'read',
          success: true,
        })
      );
    });

    it('should throw error when person not found', async () => {
      // Arrange
      mockPersonRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        personService.getPersonById('invalid-id', 'officer-123')
      ).rejects.toThrow('Person not found');
    });
  });

  describe('findByNIN', () => {
    it('should return person when found', async () => {
      // Arrange
      mockPersonRepo.findByNIN.mockResolvedValue(mockPerson);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act
      const result = await personService.findByNIN('NIN-123456789', 'officer-123');

      // Assert
      expect(result).toEqual(mockPerson);
      expect(mockPersonRepo.findByNIN).toHaveBeenCalledWith('NIN-123456789');
      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'person',
          entityId: mockPerson.id,
          officerId: 'officer-123',
          action: 'read',
          success: true,
          details: expect.objectContaining({
            searchType: 'nin',
            nin: 'NIN-123456789',
          }),
        })
      );
    });

    it('should return null when not found', async () => {
      // Arrange
      mockPersonRepo.findByNIN.mockResolvedValue(null);

      // Act
      const result = await personService.findByNIN('NIN-NOTFOUND', 'officer-123');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByFingerprint', () => {
    it('should return person when found', async () => {
      // Arrange
      mockPersonRepo.findByFingerprintHash.mockResolvedValue(mockPerson);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act
      const result = await personService.findByFingerprint(
        'fingerprint-hash-abc123',
        'officer-123'
      );

      // Assert
      expect(result).toEqual(mockPerson);
      expect(mockPersonRepo.findByFingerprintHash).toHaveBeenCalledWith('fingerprint-hash-abc123');
      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'person',
          entityId: mockPerson.id,
          officerId: 'officer-123',
          action: 'read',
          success: true,
          details: expect.objectContaining({
            searchType: 'fingerprint',
          }),
        })
      );
    });

    it('should return null when not found', async () => {
      // Arrange
      mockPersonRepo.findByFingerprintHash.mockResolvedValue(null);

      // Act
      const result = await personService.findByFingerprint(
        'invalid-hash',
        'officer-123'
      );

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('deletePerson', () => {
    it('should delete person successfully', async () => {
      // Arrange
      const personWithoutCases = { ...mockPerson, casesCount: 0 } as any;

      mockPersonRepo.findById.mockResolvedValue(mockPerson);
      mockPersonRepo.findByIdWithRelations.mockResolvedValue(personWithoutCases);
      mockPersonRepo.delete.mockResolvedValue(undefined);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act
      await personService.deletePerson('person-123', 'officer-123');

      // Assert
      expect(mockPersonRepo.delete).toHaveBeenCalledWith('person-123');
      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'person',
          entityId: 'person-123',
          action: 'delete',
          success: true,
        })
      );
    });

    it('should throw error when person not found', async () => {
      // Arrange
      mockPersonRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        personService.deletePerson('invalid-id', 'officer-123')
      ).rejects.toThrow('Person not found');

      expect(mockPersonRepo.delete).not.toHaveBeenCalled();
    });

    it('should throw error when person has linked cases', async () => {
      // Arrange
      const personWithCases = { ...mockPerson, casesCount: 3 } as any;

      mockPersonRepo.findById.mockResolvedValue(mockPerson);
      mockPersonRepo.findByIdWithRelations.mockResolvedValue(personWithCases);

      // Act & Assert
      await expect(
        personService.deletePerson('person-123', 'officer-123')
      ).rejects.toThrow('Cannot delete person linked to 3 case(s)');

      expect(mockPersonRepo.delete).not.toHaveBeenCalled();
    });
  });

  describe('markAsWanted', () => {
    it('should mark person as wanted', async () => {
      // Arrange
      const wantedPerson = new Person(
        mockPerson.id,
        mockPerson.nin,
        mockPerson.firstName,
        mockPerson.lastName,
        mockPerson.middleName,
        mockPerson.alias,
        mockPerson.dateOfBirth,
        mockPerson.gender,
        mockPerson.nationality,
        mockPerson.placeOfBirth,
        mockPerson.occupation,
        mockPerson.maritalStatus,
        mockPerson.educationLevel,
        mockPerson.tribe,
        mockPerson.religion,
        mockPerson.languagesSpoken,
        mockPerson.physicalDescription,
        mockPerson.photoUrl,
        mockPerson.addresses,
        mockPerson.phoneNumbers,
        mockPerson.emails,
        mockPerson.fingerprintHash,
        mockPerson.biometricHash,
        mockPerson.criminalHistory,
        mockPerson.riskLevel,
        true, // isWanted = true
        mockPerson.isDeceasedOrMissing,
        mockPerson.notes,
        mockPerson.stationId,
        mockPerson.createdBy,
        mockPerson.updatedBy,
        mockPerson.createdAt,
        mockPerson.updatedAt
      );

      mockPersonRepo.findById.mockResolvedValue(mockPerson);
      mockPersonRepo.markAsWanted.mockResolvedValue(wantedPerson);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act
      const result = await personService.markAsWanted(
        'person-123',
        'officer-123',
        'Suspected of robbery'
      );

      // Assert
      expect(result.isWanted).toBe(true);
      expect(mockPersonRepo.markAsWanted).toHaveBeenCalledWith('person-123', 'officer-123');
      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'update',
          details: expect.objectContaining({
            markedAsWanted: true,
            reason: 'Suspected of robbery',
          }),
        })
      );
    });

    it('should throw error when person not found', async () => {
      // Arrange
      mockPersonRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        personService.markAsWanted('invalid-id', 'officer-123', 'Test reason')
      ).rejects.toThrow('Person not found');

      expect(mockPersonRepo.markAsWanted).not.toHaveBeenCalled();
    });

    it('should throw error when person is deceased', async () => {
      // Arrange
      const deceasedPerson = new Person(
        mockPerson.id,
        mockPerson.nin,
        mockPerson.firstName,
        mockPerson.lastName,
        mockPerson.middleName,
        mockPerson.alias,
        mockPerson.dateOfBirth,
        mockPerson.gender,
        mockPerson.nationality,
        mockPerson.placeOfBirth,
        mockPerson.occupation,
        mockPerson.maritalStatus,
        mockPerson.educationLevel,
        mockPerson.tribe,
        mockPerson.religion,
        mockPerson.languagesSpoken,
        mockPerson.physicalDescription,
        mockPerson.photoUrl,
        mockPerson.addresses,
        mockPerson.phoneNumbers,
        mockPerson.emails,
        mockPerson.fingerprintHash,
        mockPerson.biometricHash,
        mockPerson.criminalHistory,
        mockPerson.riskLevel,
        mockPerson.isWanted,
        true, // isDeceasedOrMissing = true
        mockPerson.notes,
        mockPerson.stationId,
        mockPerson.createdBy,
        mockPerson.updatedBy,
        mockPerson.createdAt,
        mockPerson.updatedAt
      );

      mockPersonRepo.findById.mockResolvedValue(deceasedPerson);

      // Act & Assert
      await expect(
        personService.markAsWanted('person-123', 'officer-123', 'Test')
      ).rejects.toThrow('Cannot mark deceased/missing person as wanted');

      expect(mockPersonRepo.markAsWanted).not.toHaveBeenCalled();
    });
  });

  describe('updateRiskLevel', () => {
    it('should update risk level successfully', async () => {
      // Arrange
      const updatedPerson = new Person(
        mockPerson.id,
        mockPerson.nin,
        mockPerson.firstName,
        mockPerson.lastName,
        mockPerson.middleName,
        mockPerson.alias,
        mockPerson.dateOfBirth,
        mockPerson.gender,
        mockPerson.nationality,
        mockPerson.placeOfBirth,
        mockPerson.occupation,
        mockPerson.maritalStatus,
        mockPerson.educationLevel,
        mockPerson.tribe,
        mockPerson.religion,
        mockPerson.languagesSpoken,
        mockPerson.physicalDescription,
        mockPerson.photoUrl,
        mockPerson.addresses,
        mockPerson.phoneNumbers,
        mockPerson.emails,
        mockPerson.fingerprintHash,
        mockPerson.biometricHash,
        mockPerson.criminalHistory,
        'high', // riskLevel = high
        mockPerson.isWanted,
        mockPerson.isDeceasedOrMissing,
        mockPerson.notes,
        mockPerson.stationId,
        mockPerson.createdBy,
        mockPerson.updatedBy,
        mockPerson.createdAt,
        mockPerson.updatedAt
      );

      mockPersonRepo.findById.mockResolvedValue(mockPerson);
      mockPersonRepo.updateRiskLevel.mockResolvedValue(updatedPerson);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act
      const result = await personService.updateRiskLevel(
        'person-123',
        'high',
        'officer-123',
        'Multiple violent offenses'
      );

      // Assert
      expect(result.riskLevel).toBe('high');
      expect(mockPersonRepo.updateRiskLevel).toHaveBeenCalledWith('person-123', 'high', 'officer-123');
      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'update',
          details: expect.objectContaining({
            newRiskLevel: 'high',
            reason: 'Multiple violent offenses',
          }),
        })
      );
    });

    it('should throw error when person not found', async () => {
      // Arrange
      mockPersonRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        personService.updateRiskLevel('invalid-id', 'high', 'officer-123', 'Test')
      ).rejects.toThrow('Person not found');

      expect(mockPersonRepo.updateRiskLevel).not.toHaveBeenCalled();
    });
  });

  describe('addAlias', () => {
    it('should add alias successfully', async () => {
      // Arrange
      const updatedPerson = new Person(
        mockPerson.id,
        mockPerson.nin,
        mockPerson.firstName,
        mockPerson.lastName,
        mockPerson.middleName,
        [...mockPerson.alias, 'New Alias'],
        mockPerson.dateOfBirth,
        mockPerson.gender,
        mockPerson.nationality,
        mockPerson.placeOfBirth,
        mockPerson.occupation,
        mockPerson.maritalStatus,
        mockPerson.educationLevel,
        mockPerson.tribe,
        mockPerson.religion,
        mockPerson.languagesSpoken,
        mockPerson.physicalDescription,
        mockPerson.photoUrl,
        mockPerson.addresses,
        mockPerson.phoneNumbers,
        mockPerson.emails,
        mockPerson.fingerprintHash,
        mockPerson.biometricHash,
        mockPerson.criminalHistory,
        mockPerson.riskLevel,
        mockPerson.isWanted,
        mockPerson.isDeceasedOrMissing,
        mockPerson.notes,
        mockPerson.stationId,
        mockPerson.createdBy,
        mockPerson.updatedBy,
        mockPerson.createdAt,
        mockPerson.updatedAt
      );

      mockPersonRepo.addAlias.mockResolvedValue(updatedPerson);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act
      const result = await personService.addAlias('person-123', 'New Alias', 'officer-123');

      // Assert
      expect(result.alias).toContain('New Alias');
      expect(mockPersonRepo.addAlias).toHaveBeenCalledWith('person-123', 'New Alias', 'officer-123');
      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'update',
          details: expect.objectContaining({
            addedAlias: 'New Alias',
          }),
        })
      );
    });

    it('should throw error for alias too short', async () => {
      // Act & Assert
      await expect(
        personService.addAlias('person-123', 'A', 'officer-123')
      ).rejects.toThrow('Alias must be at least 2 characters');

      expect(mockPersonRepo.addAlias).not.toHaveBeenCalled();
    });
  });

  describe('removeAlias', () => {
    it('should remove alias successfully', async () => {
      // Arrange
      const updatedPerson = new Person(
        mockPerson.id,
        mockPerson.nin,
        mockPerson.firstName,
        mockPerson.lastName,
        mockPerson.middleName,
        ['Johnny'], // 'JD' removed
        mockPerson.dateOfBirth,
        mockPerson.gender,
        mockPerson.nationality,
        mockPerson.placeOfBirth,
        mockPerson.occupation,
        mockPerson.maritalStatus,
        mockPerson.educationLevel,
        mockPerson.tribe,
        mockPerson.religion,
        mockPerson.languagesSpoken,
        mockPerson.physicalDescription,
        mockPerson.photoUrl,
        mockPerson.addresses,
        mockPerson.phoneNumbers,
        mockPerson.emails,
        mockPerson.fingerprintHash,
        mockPerson.biometricHash,
        mockPerson.criminalHistory,
        mockPerson.riskLevel,
        mockPerson.isWanted,
        mockPerson.isDeceasedOrMissing,
        mockPerson.notes,
        mockPerson.stationId,
        mockPerson.createdBy,
        mockPerson.updatedBy,
        mockPerson.createdAt,
        mockPerson.updatedAt
      );

      mockPersonRepo.removeAlias.mockResolvedValue(updatedPerson);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act
      const result = await personService.removeAlias('person-123', 'JD', 'officer-123');

      // Assert
      expect(result.alias).not.toContain('JD');
      expect(result.alias).toContain('Johnny');
      expect(mockPersonRepo.removeAlias).toHaveBeenCalledWith('person-123', 'JD', 'officer-123');
      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'update',
          details: expect.objectContaining({
            removedAlias: 'JD',
          }),
        })
      );
    });
  });
});

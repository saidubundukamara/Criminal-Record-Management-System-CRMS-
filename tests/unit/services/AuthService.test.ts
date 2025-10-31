/**
 * AuthService Unit Tests
 *
 * Tests for Authentication business logic with mocked repositories
 * Critical for security - tests PIN validation, account locking, etc.
 */
import { AuthService } from '@/src/services/AuthService';
import { IOfficerRepository } from '@/src/domain/interfaces/repositories/IOfficerRepository';
import { IAuditLogRepository } from '@/src/domain/interfaces/repositories/IAuditLogRepository';
import { Officer } from '@/src/domain/entities/Officer';
import { ValidationError, UnauthorizedError } from '@/src/lib/errors';
import { hash as argonHash } from 'argon2';

// Mock repositories
const mockOfficerRepo = {
  findById: jest.fn(),
  findByBadge: jest.fn(),
  findByStationId: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  updateLastLogin: jest.fn(),
  resetFailedAttempts: jest.fn(),
  incrementFailedAttempts: jest.fn(),
  lockAccount: jest.fn(),
} as jest.Mocked<IOfficerRepository>;

const mockAuditRepo = {
  create: jest.fn(),
  findByEntityId: jest.fn(),
  findByOfficerId: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
} as jest.Mocked<IAuditLogRepository>;

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    // Create service with mocked repositories
    authService = new AuthService(mockOfficerRepo, mockAuditRepo);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('authenticateOfficer', () => {
    it('should authenticate officer with valid badge and PIN', async () => {
      // Arrange
      const badge = 'SA-00001';
      const pin = '12345678';
      const pinHash = await argonHash(pin);

      const mockOfficer = new Officer(
        'officer-123',
        badge,
        'John',
        'Doe',
        'john.doe@police.sl',
        pinHash,
        'role-admin',
        'Admin',
        2,
        'station-hq',
        'Headquarters',
        true,
        false,
        0,
        null,
        new Date(),
        new Date(),
        false,
        null
      );

      mockOfficerRepo.findByBadge.mockResolvedValue(mockOfficer);
      mockOfficerRepo.findById.mockResolvedValue(mockOfficer);
      mockOfficerRepo.resetFailedAttempts.mockResolvedValue(undefined);
      mockOfficerRepo.updateLastLogin.mockResolvedValue(undefined);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act
      const result = await authService.authenticateOfficer(
        badge,
        pin,
        '192.168.1.1',
        'Mozilla/5.0'
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.badge).toBe(badge);
      expect(mockOfficerRepo.findByBadge).toHaveBeenCalledWith(badge);
      expect(mockOfficerRepo.resetFailedAttempts).toHaveBeenCalledWith('officer-123');
      expect(mockOfficerRepo.updateLastLogin).toHaveBeenCalledWith('officer-123');
      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'officer',
          entityId: 'officer-123',
          action: 'login',
          success: true,
        })
      );
    });

    it('should throw ValidationError for missing badge or PIN', async () => {
      // Act & Assert - Missing badge
      await expect(
        authService.authenticateOfficer('', 'pin123456')
      ).rejects.toThrow(ValidationError);
      await expect(
        authService.authenticateOfficer('', 'pin123456')
      ).rejects.toThrow('Badge and PIN are required');

      // Act & Assert - Missing PIN
      await expect(
        authService.authenticateOfficer('SA-00001', '')
      ).rejects.toThrow(ValidationError);

      expect(mockOfficerRepo.findByBadge).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError for non-existent officer', async () => {
      // Arrange
      mockOfficerRepo.findByBadge.mockResolvedValue(null);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act & Assert
      await expect(
        authService.authenticateOfficer('INVALID-BADGE', 'pin123456')
      ).rejects.toThrow(UnauthorizedError);
      await expect(
        authService.authenticateOfficer('INVALID-BADGE', 'pin123456')
      ).rejects.toThrow('Invalid credentials');

      expect(mockOfficerRepo.findByBadge).toHaveBeenCalledWith('INVALID-BADGE');
      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'login',
          success: false,
        })
      );
    });

    it('should throw UnauthorizedError for inactive officer', async () => {
      // Arrange
      const badge = 'SA-00001';
      const pin = '12345678';
      const pinHash = await argonHash(pin);

      const inactiveOfficer = new Officer(
        'officer-123',
        badge,
        'John',
        'Doe',
        'john.doe@police.sl',
        pinHash,
        'role-admin',
        'Admin',
        2,
        'station-hq',
        'Headquarters',
        false, // isActive = false
        false,
        0,
        null,
        new Date(),
        new Date(),
        false,
        null
      );

      mockOfficerRepo.findByBadge.mockResolvedValue(inactiveOfficer);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act & Assert
      await expect(
        authService.authenticateOfficer(badge, pin)
      ).rejects.toThrow(UnauthorizedError);
      await expect(
        authService.authenticateOfficer(badge, pin)
      ).rejects.toThrow('Account is inactive');

      expect(mockOfficerRepo.findByBadge).toHaveBeenCalledWith(badge);
      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'login',
          success: false,
        })
      );
    });

    it('should throw UnauthorizedError for locked account', async () => {
      // Arrange
      const badge = 'SA-00001';
      const pin = '12345678';
      const pinHash = await argonHash(pin);

      const lockedOfficer = new Officer(
        'officer-123',
        badge,
        'John',
        'Doe',
        'john.doe@police.sl',
        pinHash,
        'role-admin',
        'Admin',
        2,
        'station-hq',
        'Headquarters',
        true,
        true, // isLocked = true
        5,
        new Date(),
        new Date(),
        new Date(),
        false,
        null
      );

      mockOfficerRepo.findByBadge.mockResolvedValue(lockedOfficer);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act & Assert
      await expect(
        authService.authenticateOfficer(badge, pin)
      ).rejects.toThrow(UnauthorizedError);
      await expect(
        authService.authenticateOfficer(badge, pin)
      ).rejects.toThrow('Account is locked');

      expect(mockOfficerRepo.findByBadge).toHaveBeenCalledWith(badge);
    });

    it('should throw UnauthorizedError for invalid PIN', async () => {
      // Arrange
      const badge = 'SA-00001';
      const correctPin = '12345678';
      const wrongPin = '99999999';
      const pinHash = await argonHash(correctPin);

      const mockOfficer = new Officer(
        'officer-123',
        badge,
        'John',
        'Doe',
        'john.doe@police.sl',
        pinHash,
        'role-admin',
        'Admin',
        2,
        'station-hq',
        'Headquarters',
        true,
        false,
        0,
        null,
        new Date(),
        new Date(),
        false,
        null
      );

      mockOfficerRepo.findByBadge.mockResolvedValue(mockOfficer);
      mockOfficerRepo.findById.mockResolvedValue(mockOfficer);
      mockOfficerRepo.incrementFailedAttempts.mockResolvedValue(undefined);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act & Assert
      await expect(
        authService.authenticateOfficer(badge, wrongPin)
      ).rejects.toThrow(UnauthorizedError);
      await expect(
        authService.authenticateOfficer(badge, wrongPin)
      ).rejects.toThrow('Invalid credentials');

      expect(mockOfficerRepo.incrementFailedAttempts).toHaveBeenCalledWith('officer-123');
      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'login',
          success: false,
        })
      );
    });

    it('should lock account after 5 failed attempts', async () => {
      // Arrange
      const badge = 'SA-00001';
      const correctPin = '12345678';
      const wrongPin = '99999999';
      const pinHash = await argonHash(correctPin);

      const mockOfficer = new Officer(
        'officer-123',
        badge,
        'John',
        'Doe',
        'john.doe@police.sl',
        pinHash,
        'role-admin',
        'Admin',
        2,
        'station-hq',
        'Headquarters',
        true,
        false,
        4, // 4 failed attempts already
        null,
        new Date(),
        new Date(),
        false,
        null
      );

      mockOfficerRepo.findByBadge.mockResolvedValue(mockOfficer);
      mockOfficerRepo.findById.mockResolvedValue(mockOfficer);
      mockOfficerRepo.incrementFailedAttempts.mockResolvedValue(undefined);
      mockOfficerRepo.lockAccount.mockResolvedValue(undefined);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act & Assert
      await expect(
        authService.authenticateOfficer(badge, wrongPin)
      ).rejects.toThrow(UnauthorizedError);

      expect(mockOfficerRepo.incrementFailedAttempts).toHaveBeenCalledWith('officer-123');
      expect(mockOfficerRepo.lockAccount).toHaveBeenCalledWith('officer-123');
    });
  });

  describe('changePin', () => {
    it('should change PIN with valid old PIN', async () => {
      // Arrange
      const officerId = 'officer-123';
      const oldPin = '12345678';
      const newPin = '87654321';
      const oldPinHash = await argonHash(oldPin);

      const mockOfficer = new Officer(
        officerId,
        'SA-00001',
        'John',
        'Doe',
        'john.doe@police.sl',
        oldPinHash,
        'role-admin',
        'Admin',
        2,
        'station-hq',
        'Headquarters',
        true,
        false,
        0,
        null,
        new Date(),
        new Date(),
        false,
        null
      );

      mockOfficerRepo.findById.mockResolvedValue(mockOfficer);
      mockOfficerRepo.update.mockResolvedValue(mockOfficer);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act
      await authService.changePin(officerId, oldPin, newPin);

      // Assert
      expect(mockOfficerRepo.findById).toHaveBeenCalledWith(officerId);
      expect(mockOfficerRepo.update).toHaveBeenCalledWith(
        officerId,
        expect.objectContaining({
          pinHash: expect.any(String),
        })
      );
      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'officer',
          entityId: officerId,
          action: 'change_pin',
          success: true,
        })
      );
    });

    it('should throw ValidationError for weak PIN', async () => {
      // Arrange
      const officerId = 'officer-123';
      const oldPin = '12345678';
      const weakPin = '1234'; // Too short

      // Act & Assert
      await expect(
        authService.changePin(officerId, oldPin, weakPin)
      ).rejects.toThrow(ValidationError);
      await expect(
        authService.changePin(officerId, oldPin, weakPin)
      ).rejects.toThrow('PIN must be at least 8 characters');

      expect(mockOfficerRepo.findById).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for sequential PIN', async () => {
      // Arrange
      const officerId = 'officer-123';
      const oldPin = '12345678';
      const sequentialPin = '12345678'; // Sequential digits

      // Act & Assert
      await expect(
        authService.changePin(officerId, oldPin, sequentialPin)
      ).rejects.toThrow(ValidationError);
      await expect(
        authService.changePin(officerId, oldPin, sequentialPin)
      ).rejects.toThrow('PIN cannot contain sequential digits');

      expect(mockOfficerRepo.findById).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for repeating PIN', async () => {
      // Arrange
      const officerId = 'officer-123';
      const oldPin = '12345678';
      const repeatingPin = '11111111'; // All same digits

      // Act & Assert
      await expect(
        authService.changePin(officerId, oldPin, repeatingPin)
      ).rejects.toThrow(ValidationError);
      await expect(
        authService.changePin(officerId, oldPin, repeatingPin)
      ).rejects.toThrow('PIN cannot be all the same digit');

      expect(mockOfficerRepo.findById).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError for incorrect old PIN', async () => {
      // Arrange
      const officerId = 'officer-123';
      const correctOldPin = '12345678';
      const wrongOldPin = '99999999';
      const newPin = '87654321';
      const oldPinHash = await argonHash(correctOldPin);

      const mockOfficer = new Officer(
        officerId,
        'SA-00001',
        'John',
        'Doe',
        'john.doe@police.sl',
        oldPinHash,
        'role-admin',
        'Admin',
        2,
        'station-hq',
        'Headquarters',
        true,
        false,
        0,
        null,
        new Date(),
        new Date(),
        false,
        null
      );

      mockOfficerRepo.findById.mockResolvedValue(mockOfficer);
      mockAuditRepo.create.mockResolvedValue({} as any);

      // Act & Assert
      await expect(
        authService.changePin(officerId, wrongOldPin, newPin)
      ).rejects.toThrow(UnauthorizedError);
      await expect(
        authService.changePin(officerId, wrongOldPin, newPin)
      ).rejects.toThrow('Current PIN is incorrect');

      expect(mockOfficerRepo.update).not.toHaveBeenCalled();
      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'change_pin',
          success: false,
        })
      );
    });
  });
});

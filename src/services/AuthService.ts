/**
 * Authentication Service
 *
 * Handles all authentication business logic:
 * - Officer authentication (Badge + PIN)
 * - PIN management (change, reset)
 * - Account locking after failed attempts
 * - PIN strength validation
 *
 * Pan-African Design: Secure authentication for law enforcement across Africa
 */
import { IOfficerRepository } from "@/src/domain/interfaces/repositories/IOfficerRepository";
import { IAuditLogRepository } from "@/src/domain/interfaces/repositories/IAuditLogRepository";
import { Officer } from "@/src/domain/entities/Officer";
import { ValidationError, UnauthorizedError } from "@/src/lib/errors";
import { verify, hash as argonHash } from "argon2";

export class AuthService {
  constructor(
    private readonly officerRepo: IOfficerRepository,
    private readonly auditRepo: IAuditLogRepository
  ) {}

  /**
   * Authenticate officer with Badge + PIN
   * Returns authenticated officer or throws error
   */
  async authenticateOfficer(
    badge: string,
    pin: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Officer> {
    // Validation
    if (!badge || !pin) {
      throw new ValidationError("Badge and PIN are required");
    }

    // Find officer by badge
    const officer = await this.officerRepo.findByBadge(badge);
    if (!officer) {
      await this.logFailedLogin(null, badge, "Officer not found", ipAddress, userAgent);
      throw new UnauthorizedError("Invalid credentials");
    }

    // Check if officer can login (uses domain logic)
    const loginCheck = officer.canLogin();
    if (!loginCheck.allowed) {
      await this.logFailedLogin(officer.id, badge, loginCheck.reason!, ipAddress, userAgent);
      throw new UnauthorizedError(loginCheck.reason!);
    }

    // Verify PIN
    // Get pinHash from database (not exposed in domain entity for security)
    const pinHash = await this.officerRepo.getPinHash(officer.id);
    if (!pinHash) {
      throw new UnauthorizedError("Officer not found");
    }

    const isValidPin = await this.verifyPin(pin, pinHash);
    if (!isValidPin) {
      await this.handleFailedLogin(officer.id, badge, ipAddress, userAgent);
      throw new UnauthorizedError("Invalid credentials");
    }

    // Success - reset failed attempts and update last login
    await this.officerRepo.resetFailedAttempts(officer.id);
    await this.officerRepo.updateLastLogin(officer.id);

    // Audit successful login
    await this.auditRepo.create({
      entityType: "officer",
      entityId: officer.id,
      officerId: officer.id,
      action: "login",
      success: true,
      details: { badge },
      ipAddress,
      userAgent,
    });

    return officer;
  }

  /**
   * Change officer's PIN
   * Requires current PIN for verification
   */
  async changePin(
    officerId: string,
    oldPin: string,
    newPin: string
  ): Promise<void> {
    // Validate new PIN strength
    this.validatePinStrength(newPin);

    // Get officer
    const officer = await this.officerRepo.findById(officerId);
    if (!officer) {
      throw new UnauthorizedError("Officer not found");
    }

    // Verify old PIN
    const pinHash = await this.officerRepo.getPinHash(officerId);
    if (!pinHash) {
      throw new UnauthorizedError("Officer not found");
    }
    const isValidOldPin = await this.verifyPin(oldPin, pinHash);
    if (!isValidOldPin) {
      await this.auditRepo.create({
        entityType: "officer",
        entityId: officerId,
        officerId,
        action: "pin_change",
        success: false,
        details: { reason: "Invalid current PIN" },
      });
      throw new UnauthorizedError("Invalid current PIN");
    }

    // Hash new PIN
    const newPinHash = await argonHash(newPin);

    // Update PIN
    await this.officerRepo.updatePinHash(officerId, newPinHash);

    // Audit
    await this.auditRepo.create({
      entityType: "officer",
      entityId: officerId,
      officerId,
      action: "pin_change",
      success: true,
      details: {},
    });
  }

  /**
   * Reset officer's PIN (admin-initiated)
   * Does NOT require current PIN
   */
  async resetPin(
    officerId: string,
    newPin: string,
    adminId: string
  ): Promise<void> {
    // Validate new PIN strength
    this.validatePinStrength(newPin);

    // Verify officer exists
    const officer = await this.officerRepo.findById(officerId);
    if (!officer) {
      throw new ValidationError("Officer not found");
    }

    // Hash new PIN
    const newPinHash = await argonHash(newPin);

    // Update PIN
    await this.officerRepo.updatePinHash(officerId, newPinHash);

    // Also reset failed attempts and unlock if locked
    await this.officerRepo.resetFailedAttempts(officerId);

    // Audit
    await this.auditRepo.create({
      entityType: "officer",
      entityId: officerId,
      officerId: adminId,
      action: "pin_reset",
      success: true,
      details: { targetOfficerId: officerId },
    });
  }

  /**
   * Validate PIN strength
   * Throws ValidationError if PIN is weak
   */
  private validatePinStrength(pin: string): void {
    if (pin.length < 8) {
      throw new ValidationError("PIN must be at least 8 digits");
    }

    if (!/^\d+$/.test(pin)) {
      throw new ValidationError("PIN must contain only digits");
    }

    if (/^(\d)\1+$/.test(pin)) {
      throw new ValidationError("PIN cannot be all the same digit");
    }

    const commonPins = ["12345678", "87654321", "11111111", "00000000"];
    if (commonPins.includes(pin)) {
      throw new ValidationError("PIN is too common. Please choose a more secure PIN.");
    }
  }

  /**
   * Verify PIN against officer's stored hash
   * Uses Argon2id for secure password hashing
   */
  private async verifyPin(pin: string, pinHash: string): Promise<boolean> {
    try {
      if (!pinHash) {
        return false;
      }
      return await verify(pinHash, pin);
    } catch (error) {
      console.error("PIN verification error:", error);
      return false;
    }
  }

  /**
   * Handle failed login attempt
   * Increments failed attempts and locks account after 5 failures
   */
  private async handleFailedLogin(
    officerId: string,
    badge: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    // Increment failed attempts
    await this.officerRepo.incrementFailedAttempts(officerId);

    // Get updated officer to check failed attempts count
    const officer = await this.officerRepo.findById(officerId);
    if (!officer) return;

    const failedAttempts = officer.failedAttempts + 1;

    // Lock account after 5 failed attempts (for 30 minutes)
    if (failedAttempts >= 5) {
      const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      await this.officerRepo.lockAccount(officerId, lockUntil);

      // Audit account lock
      await this.auditRepo.create({
        entityType: "officer",
        entityId: officerId,
        officerId,
        action: "account_locked",
        success: true,
        details: {
          badge,
          failedAttempts,
          lockedUntil: lockUntil.toISOString(),
          reason: "Too many failed login attempts",
        },
        ipAddress,
        userAgent,
      });
    }

    // Audit failed login
    await this.auditRepo.create({
      entityType: "officer",
      entityId: officerId,
      officerId,
      action: "login",
      success: false,
      details: {
        badge,
        failedAttempts,
        reason: "Invalid PIN",
      },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log failed login when officer doesn't exist
   */
  private async logFailedLogin(
    officerId: string | null,
    badge: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.auditRepo.create({
      entityType: "officer",
      entityId: officerId || undefined,
      officerId: officerId || undefined,
      action: "login",
      success: false,
      details: { badge, reason },
      ipAddress,
      userAgent,
    });
  }
}

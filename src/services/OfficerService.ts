/**
 * Officer Service
 *
 * Handles all officer management business logic:
 * - Officer creation, update, deletion (soft delete)
 * - Account activation/deactivation
 * - Account unlocking and PIN reset
 * - Bulk operations
 * - Officer filtering and search
 *
 * Pan-African Design: Supports any country's police structure and badge formats
 */
import {
  IOfficerRepository,
  CreateOfficerDto,
  UpdateOfficerDto,
  OfficerFilters,
} from "@/src/domain/interfaces/repositories/IOfficerRepository";
import { IRoleRepository } from "@/src/domain/interfaces/repositories/IRoleRepository";
import { IStationRepository } from "@/src/domain/interfaces/repositories/IStationRepository";
import { IAuditLogRepository } from "@/src/domain/interfaces/repositories/IAuditLogRepository";
import { Officer } from "@/src/domain/entities/Officer";
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from "@/src/lib/errors";
import * as argon2 from "argon2";

export interface CreateOfficerInput {
  badge: string;
  name: string;
  email?: string;
  phone?: string;
  pin: string; // Plain text PIN (will be hashed)
  roleId: string;
  stationId: string;
}

export interface UpdateOfficerInput {
  name?: string;
  email?: string;
  phone?: string;
  roleId?: string;
  stationId?: string;
  active?: boolean;
}

export interface BulkActionInput {
  officerIds: string[];
}

export class OfficerService {
  constructor(
    private readonly officerRepo: IOfficerRepository,
    private readonly roleRepo: IRoleRepository,
    private readonly stationRepo: IStationRepository,
    private readonly auditRepo: IAuditLogRepository
  ) {}

  /**
   * Create a new officer
   * Validates input, hashes PIN, and ensures unique badge
   */
  async createOfficer(
    data: CreateOfficerInput,
    createdBy: string,
    ipAddress?: string
  ): Promise<Officer> {
    // Validation
    this.validateOfficerInput(data);

    // Validate role exists
    const role = await this.roleRepo.findById(data.roleId);
    if (!role) {
      throw new ValidationError(`Role with ID ${data.roleId} not found`);
    }

    // Validate station exists
    const station = await this.stationRepo.findById(data.stationId);
    if (!station) {
      throw new ValidationError(`Station with ID ${data.stationId} not found`);
    }

    // Check badge uniqueness
    const existingOfficer = await this.officerRepo.findByBadge(data.badge);
    if (existingOfficer) {
      throw new ValidationError(
        `Badge ${data.badge} is already in use`
      );
    }

    // Hash PIN with Argon2id
    const pinHash = await argon2.hash(data.pin, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4,
    });

    // Create officer
    const officerData: CreateOfficerDto = {
      badge: data.badge.toUpperCase().trim(),
      name: data.name.trim(),
      email: data.email?.toLowerCase().trim(),
      phone: data.phone?.trim(),
      pinHash,
      roleId: data.roleId,
      stationId: data.stationId,
    };

    const newOfficer = await this.officerRepo.create(officerData);

    // Audit log
    await this.auditRepo.create({
      entityType: "officer",
      entityId: newOfficer.id,
      officerId: createdBy,
      action: "create",
      success: true,
      details: {
        badge: newOfficer.badge,
        name: newOfficer.name,
        roleId: newOfficer.roleId,
        stationId: newOfficer.stationId,
      },
      ipAddress,
    });

    return newOfficer;
  }

  /**
   * Get officer by ID
   */
  async getOfficer(id: string): Promise<Officer> {
    const officer = await this.officerRepo.findById(id);

    if (!officer) {
      throw new NotFoundError(`Officer with ID ${id} not found`);
    }

    return officer;
  }

  /**
   * Get officer by badge
   */
  async getOfficerByBadge(badge: string): Promise<Officer> {
    const officer = await this.officerRepo.findByBadge(
      badge.toUpperCase().trim()
    );

    if (!officer) {
      throw new NotFoundError(`Officer with badge ${badge} not found`);
    }

    return officer;
  }

  /**
   * List officers with filters
   */
  async listOfficers(filters?: OfficerFilters): Promise<Officer[]> {
    return await this.officerRepo.findAll(filters);
  }

  /**
   * Update officer
   * Validates input and logs changes
   */
  async updateOfficer(
    id: string,
    data: UpdateOfficerInput,
    updatedBy: string,
    ipAddress?: string
  ): Promise<Officer> {
    // Check officer exists
    const existingOfficer = await this.getOfficer(id);

    // Validate role if provided
    if (data.roleId) {
      const role = await this.roleRepo.findById(data.roleId);
      if (!role) {
        throw new ValidationError(`Role with ID ${data.roleId} not found`);
      }
    }

    // Validate station if provided
    if (data.stationId) {
      const station = await this.stationRepo.findById(data.stationId);
      if (!station) {
        throw new ValidationError(
          `Station with ID ${data.stationId} not found`
        );
      }
    }

    // Validate email format if provided
    if (data.email && !this.isValidEmail(data.email)) {
      throw new ValidationError("Invalid email format");
    }

    // Prepare update data
    const updateData: UpdateOfficerDto = {
      ...data,
      name: data.name?.trim(),
      email: data.email?.toLowerCase().trim(),
      phone: data.phone?.trim(),
    };

    // Update officer
    const updatedOfficer = await this.officerRepo.update(id, updateData);

    // Audit log
    await this.auditRepo.create({
      entityType: "officer",
      entityId: id,
      officerId: updatedBy,
      action: "update",
      success: true,
      details: {
        badge: existingOfficer.badge,
        changes: data,
      },
      ipAddress,
    });

    return updatedOfficer;
  }

  /**
   * Soft delete officer
   * Sets active = false instead of deleting the record
   */
  async deleteOfficer(
    id: string,
    deletedBy: string,
    ipAddress?: string
  ): Promise<void> {
    // Check officer exists
    const officer = await this.getOfficer(id);

    // Prevent deleting yourself
    if (id === deletedBy) {
      throw new ForbiddenError("Cannot delete your own account");
    }

    // Soft delete (set active = false)
    await this.officerRepo.update(id, { active: false });

    // Audit log
    await this.auditRepo.create({
      entityType: "officer",
      entityId: id,
      officerId: deletedBy,
      action: "delete",
      success: true,
      details: {
        badge: officer.badge,
        name: officer.name,
      },
      ipAddress,
    });
  }

  /**
   * Activate officer account
   */
  async activateOfficer(
    id: string,
    activatedBy: string,
    ipAddress?: string
  ): Promise<Officer> {
    const officer = await this.getOfficer(id);

    if (officer.active) {
      throw new ValidationError("Officer account is already active");
    }

    // Update active status
    await this.officerRepo.update(id, { active: true });

    // Reset failed attempts (clears lock as well)
    await this.officerRepo.resetFailedAttempts(id);

    // Get updated officer
    const updatedOfficer = await this.getOfficer(id);

    // Audit log
    await this.auditRepo.create({
      entityType: "officer",
      entityId: id,
      officerId: activatedBy,
      action: "activate",
      success: true,
      details: {
        badge: officer.badge,
        name: officer.name,
      },
      ipAddress,
    });

    return updatedOfficer;
  }

  /**
   * Deactivate officer account
   */
  async deactivateOfficer(
    id: string,
    deactivatedBy: string,
    ipAddress?: string
  ): Promise<Officer> {
    const officer = await this.getOfficer(id);

    // Prevent deactivating yourself
    if (id === deactivatedBy) {
      throw new ForbiddenError("Cannot deactivate your own account");
    }

    if (!officer.active) {
      throw new ValidationError("Officer account is already inactive");
    }

    const updatedOfficer = await this.officerRepo.update(id, {
      active: false,
    });

    // Audit log
    await this.auditRepo.create({
      entityType: "officer",
      entityId: id,
      officerId: deactivatedBy,
      action: "deactivate",
      success: true,
      details: {
        badge: officer.badge,
        name: officer.name,
      },
      ipAddress,
    });

    return updatedOfficer;
  }

  /**
   * Unlock officer account
   * Clears failed attempts and lock
   */
  async unlockOfficer(
    id: string,
    unlockedBy: string,
    ipAddress?: string
  ): Promise<Officer> {
    const officer = await this.getOfficer(id);

    // Reset failed attempts (clears lock as well)
    await this.officerRepo.resetFailedAttempts(id);

    // Get updated officer
    const updatedOfficer = await this.getOfficer(id);

    // Audit log
    await this.auditRepo.create({
      entityType: "officer",
      entityId: id,
      officerId: unlockedBy,
      action: "unlock",
      success: true,
      details: {
        badge: officer.badge,
        name: officer.name,
        previousFailedAttempts: officer.failedAttempts,
      },
      ipAddress,
    });

    return updatedOfficer;
  }

  /**
   * Reset officer PIN to default (12345678)
   * Officer will be forced to change on next login
   */
  async resetPin(
    id: string,
    resetBy: string,
    ipAddress?: string
  ): Promise<Officer> {
    const officer = await this.getOfficer(id);

    // Generate default PIN: 12345678
    const defaultPin = "12345678";
    const pinHash = await argon2.hash(defaultPin, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    // Update PIN hash
    await this.officerRepo.updatePinHash(id, pinHash);

    // Reset failed attempts (clears lock as well)
    await this.officerRepo.resetFailedAttempts(id);

    // Get updated officer
    const updatedOfficer = await this.getOfficer(id);

    // Audit log
    await this.auditRepo.create({
      entityType: "officer",
      entityId: id,
      officerId: resetBy,
      action: "reset_pin",
      success: true,
      details: {
        badge: officer.badge,
        name: officer.name,
        defaultPin: defaultPin, // Log for reference (admins should communicate this)
      },
      ipAddress,
    });

    return updatedOfficer;
  }

  /**
   * Bulk activate officers
   */
  async bulkActivate(
    data: BulkActionInput,
    activatedBy: string,
    ipAddress?: string
  ): Promise<{ successful: string[]; failed: string[] }> {
    const successful: string[] = [];
    const failed: string[] = [];

    for (const officerId of data.officerIds) {
      try {
        await this.activateOfficer(officerId, activatedBy, ipAddress);
        successful.push(officerId);
      } catch (error) {
        failed.push(officerId);
      }
    }

    return { successful, failed };
  }

  /**
   * Bulk deactivate officers
   */
  async bulkDeactivate(
    data: BulkActionInput,
    deactivatedBy: string,
    ipAddress?: string
  ): Promise<{ successful: string[]; failed: string[] }> {
    const successful: string[] = [];
    const failed: string[] = [];

    for (const officerId of data.officerIds) {
      try {
        await this.deactivateOfficer(officerId, deactivatedBy, ipAddress);
        successful.push(officerId);
      } catch (error) {
        failed.push(officerId);
      }
    }

    return { successful, failed };
  }

  /**
   * Bulk reset PINs
   */
  async bulkResetPins(
    data: BulkActionInput,
    resetBy: string,
    ipAddress?: string
  ): Promise<{ successful: string[]; failed: string[] }> {
    const successful: string[] = [];
    const failed: string[] = [];

    for (const officerId of data.officerIds) {
      try {
        await this.resetPin(officerId, resetBy, ipAddress);
        successful.push(officerId);
      } catch (error) {
        failed.push(officerId);
      }
    }

    return { successful, failed };
  }

  /**
   * Get officer statistics
   */
  async getStats(filters?: { stationId?: string; roleId?: string }): Promise<{
    total: number;
    active: number;
    inactive: number;
    locked: number;
  }> {
    const allOfficers = await this.officerRepo.findAll(filters);

    const now = new Date();
    const stats = {
      total: allOfficers.length,
      active: allOfficers.filter((o) => o.active).length,
      inactive: allOfficers.filter((o) => !o.active).length,
      locked: allOfficers.filter(
        (o) => o.lockedUntil && o.lockedUntil > now
      ).length,
    };

    return stats;
  }

  /**
   * Validate officer input
   */
  private validateOfficerInput(data: CreateOfficerInput): void {
    if (!data.badge || data.badge.trim().length === 0) {
      throw new ValidationError("Badge is required");
    }

    if (!data.name || data.name.trim().length < 2) {
      throw new ValidationError("Name must be at least 2 characters");
    }

    if (!data.pin || data.pin.length !== 8) {
      throw new ValidationError("PIN must be exactly 8 digits");
    }

    if (!/^\d{8}$/.test(data.pin)) {
      throw new ValidationError("PIN must contain only numbers");
    }

    if (!data.roleId) {
      throw new ValidationError("Role is required");
    }

    if (!data.stationId) {
      throw new ValidationError("Station is required");
    }

    if (data.email && !this.isValidEmail(data.email)) {
      throw new ValidationError("Invalid email format");
    }

    if (data.phone && !this.isValidPhone(data.phone)) {
      throw new ValidationError("Invalid phone format");
    }

    // Badge format validation (basic - can be customized per country)
    if (!/^[A-Z]{2,4}-\d{4,6}$/.test(data.badge.toUpperCase().trim())) {
      throw new ValidationError(
        "Invalid badge format. Expected format: XX-XXXX or XXX-XXXXX"
      );
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone format
   */
  private isValidPhone(phone: string): boolean {
    // Basic phone validation (can be customized per country)
    const phoneRegex = /^\+?[\d\s\-()]{8,20}$/;
    return phoneRegex.test(phone);
  }
}

/**
 * Alert Service
 *
 * Business logic layer for alert management (Amber Alerts & Wanted Persons)
 * Handles validation, status management, broadcasting, and audit logging
 *
 * Pan-African Design:
 * - Country-agnostic alert management
 * - Regional/cross-border alert support
 * - USSD-compatible messaging
 */

import {
  IAmberAlertRepository,
  CreateAmberAlertDto,
  UpdateAmberAlertDto,
  AmberAlertFilters,
  AmberAlertStatistics,
} from "@/src/domain/interfaces/repositories/IAmberAlertRepository";
import {
  IWantedPersonRepository,
  CreateWantedPersonDto,
  UpdateWantedPersonDto,
  WantedPersonFilters,
  WantedPersonStatistics,
  WantedPersonWithPerson,
} from "@/src/domain/interfaces/repositories/IWantedPersonRepository";
import { IPersonRepository } from "@/src/domain/interfaces/repositories/IPersonRepository";
import { IAuditLogRepository } from "@/src/domain/interfaces/repositories/IAuditLogRepository";
import {
  AmberAlert,
  AmberAlertStatus,
  Gender,
} from "@/src/domain/entities/AmberAlert";
import {
  WantedPerson,
  WantedPersonStatus,
  DangerLevel,
  CriminalCharge,
} from "@/src/domain/entities/WantedPerson";
import { ValidationError, NotFoundError, ForbiddenError } from "@/src/lib/errors";

/**
 * Input for creating an Amber Alert
 */
export interface CreateAmberAlertInput {
  personName: string;
  age: number | null;
  gender: Gender | null;
  description: string;
  photoUrl?: string | null;
  lastSeenLocation?: string | null;
  lastSeenDate?: string | null; // ISO string
  contactPhone: string;
  publishNow?: boolean; // Auto-publish on creation
}

/**
 * Input for updating an Amber Alert
 */
export interface UpdateAmberAlertInput {
  personName?: string;
  age?: number | null;
  gender?: Gender | null;
  description?: string;
  photoUrl?: string | null;
  lastSeenLocation?: string | null;
  lastSeenDate?: string | null;
  contactPhone?: string;
}

/**
 * Input for creating a Wanted Person
 */
export interface CreateWantedPersonInput {
  personId: string;
  charges: CriminalCharge[];
  dangerLevel: DangerLevel;
  warrantNumber: string;
  issuedDate: string; // ISO string
  expiresAt?: string | null; // ISO string
  lastSeenLocation?: string | null;
  lastSeenDate?: string | null;
  physicalDescription: string;
  photoUrl?: string | null;
  rewardAmount?: number | null;
  contactPhone: string;
  isRegionalAlert?: boolean;
}

/**
 * Input for updating a Wanted Person
 */
export interface UpdateWantedPersonInput {
  charges?: CriminalCharge[];
  dangerLevel?: DangerLevel;
  lastSeenLocation?: string | null;
  lastSeenDate?: string | null;
  physicalDescription?: string;
  photoUrl?: string | null;
  rewardAmount?: number | null;
  contactPhone?: string;
  isRegionalAlert?: boolean;
}

/**
 * AlertService class
 */
export class AlertService {
  constructor(
    private readonly amberAlertRepo: IAmberAlertRepository,
    private readonly wantedPersonRepo: IWantedPersonRepository,
    private readonly personRepo: IPersonRepository,
    private readonly auditRepo: IAuditLogRepository
  ) {}

  // =====================
  // AMBER ALERT METHODS
  // =====================

  /**
   * Validate Amber Alert data
   */
  private validateAmberAlertData(data: CreateAmberAlertInput | UpdateAmberAlertInput): void {
    if ("personName" in data && data.personName) {
      if (data.personName.trim().length < 2 || data.personName.trim().length > 100) {
        throw new ValidationError("Person name must be between 2 and 100 characters");
      }
    }

    if ("age" in data && data.age !== undefined && data.age !== null) {
      if (data.age < 0 || data.age >= 18) {
        throw new ValidationError("Amber Alerts are only for children under 18");
      }
    }

    if ("description" in data && data.description) {
      if (data.description.length < 20 || data.description.length > 1000) {
        throw new ValidationError("Description must be between 20 and 1000 characters");
      }
    }

    if ("contactPhone" in data && data.contactPhone) {
      if (data.contactPhone.trim().length < 7) {
        throw new ValidationError("Contact phone number is required");
      }
    }
  }

  /**
   * Create an Amber Alert
   */
  async createAmberAlert(
    input: CreateAmberAlertInput,
    createdBy: string,
    ipAddress?: string
  ): Promise<AmberAlert> {
    // Validate
    this.validateAmberAlertData(input);

    // Calculate expiration (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Prepare DTO
    const dto: CreateAmberAlertDto = {
      personName: input.personName,
      age: input.age,
      gender: input.gender,
      description: input.description,
      photoUrl: input.photoUrl || null,
      lastSeenLocation: input.lastSeenLocation || null,
      lastSeenDate: input.lastSeenDate ? new Date(input.lastSeenDate) : null,
      contactPhone: input.contactPhone,
      status: input.publishNow ? "active" : "active", // Always active by default
      publishedAt: input.publishNow ? new Date() : null,
      expiresAt: input.publishNow ? expiresAt : null,
      createdById: createdBy,
    };

    // Create alert
    const alert = await this.amberAlertRepo.create(dto);

    // Audit
    await this.auditRepo.create({
      entityType: "amber_alert",
      entityId: alert.id,
      officerId: createdBy,
      action: "create",
      success: true,
      details: {
        personName: alert.personName,
        age: alert.age,
        status: alert.status,
        published: input.publishNow,
      },
      ipAddress,
    });

    return alert;
  }

  /**
   * Get Amber Alert by ID
   */
  async getAmberAlertById(id: string): Promise<AmberAlert> {
    const alert = await this.amberAlertRepo.findById(id);

    if (!alert) {
      throw new NotFoundError("Amber Alert not found");
    }

    return alert;
  }

  /**
   * Update Amber Alert
   */
  async updateAmberAlert(
    id: string,
    input: UpdateAmberAlertInput,
    updatedBy: string,
    ipAddress?: string
  ): Promise<AmberAlert> {
    const existing = await this.amberAlertRepo.findById(id);

    if (!existing) {
      throw new NotFoundError("Amber Alert not found");
    }

    // Cannot update found or expired alerts
    if (existing.status === "found" || existing.status === "expired") {
      throw new ForbiddenError("Cannot update found or expired alerts");
    }

    // Validate
    this.validateAmberAlertData(input);

    // Prepare DTO
    const dto: UpdateAmberAlertDto = {
      ...(input.personName && { personName: input.personName }),
      ...(input.age !== undefined && { age: input.age }),
      ...(input.gender !== undefined && { gender: input.gender }),
      ...(input.description && { description: input.description }),
      ...(input.photoUrl !== undefined && { photoUrl: input.photoUrl }),
      ...(input.lastSeenLocation !== undefined && { lastSeenLocation: input.lastSeenLocation }),
      ...(input.lastSeenDate !== undefined && { lastSeenDate: input.lastSeenDate ? new Date(input.lastSeenDate) : null }),
      ...(input.contactPhone && { contactPhone: input.contactPhone }),
    };

    // Update
    const alert = await this.amberAlertRepo.update(id, dto);

    // Audit
    await this.auditRepo.create({
      entityType: "amber_alert",
      entityId: id,
      officerId: updatedBy,
      action: "update",
      success: true,
      details: {
        updatedFields: Object.keys(input),
      },
      ipAddress,
    });

    return alert;
  }

  /**
   * Publish/activate an Amber Alert
   */
  async publishAmberAlert(
    id: string,
    publishedBy: string,
    ipAddress?: string
  ): Promise<AmberAlert> {
    const alert = await this.amberAlertRepo.findById(id);

    if (!alert) {
      throw new NotFoundError("Amber Alert not found");
    }

    // Validate using domain logic
    const activationCheck = alert.canBeActivated();
    if (!activationCheck.allowed) {
      throw new ForbiddenError(activationCheck.reason!);
    }

    // Publish alert
    const published = await this.amberAlertRepo.publishAlert(id);

    // Audit
    await this.auditRepo.create({
      entityType: "amber_alert",
      entityId: id,
      officerId: publishedBy,
      action: "update",
      success: true,
      details: {
        published: true,
        expiresAt: published.expiresAt,
      },
      ipAddress,
    });

    return published;
  }

  /**
   * Resolve Amber Alert (mark as found)
   */
  async resolveAmberAlert(
    id: string,
    resolvedBy: string,
    ipAddress?: string
  ): Promise<AmberAlert> {
    const alert = await this.amberAlertRepo.findById(id);

    if (!alert) {
      throw new NotFoundError("Amber Alert not found");
    }

    // Validate using domain logic
    const resolveCheck = alert.canBeResolved();
    if (!resolveCheck.allowed) {
      throw new ForbiddenError(resolveCheck.reason!);
    }

    // Resolve alert
    const resolved = await this.amberAlertRepo.resolveAlert(id);

    // Audit
    await this.auditRepo.create({
      entityType: "amber_alert",
      entityId: id,
      officerId: resolvedBy,
      action: "update",
      success: true,
      details: {
        resolved: true,
        status: "found",
      },
      ipAddress,
    });

    return resolved;
  }

  /**
   * Get active Amber Alerts
   */
  async getActiveAmberAlerts(limit = 100): Promise<AmberAlert[]> {
    return this.amberAlertRepo.findActive(limit);
  }

  /**
   * Search Amber Alerts
   */
  async searchAmberAlerts(
    filters: AmberAlertFilters,
    limit = 100,
    offset = 0
  ): Promise<{ alerts: AmberAlert[]; total: number }> {
    const [alerts, total] = await Promise.all([
      this.amberAlertRepo.findAll(filters, limit, offset),
      this.amberAlertRepo.count(filters),
    ]);

    return { alerts, total };
  }

  /**
   * Auto-expire old Amber Alerts
   */
  async autoExpireAmberAlerts(maxDaysActive = 30): Promise<number> {
    const toExpire = await this.amberAlertRepo.findShouldAutoExpire(maxDaysActive);

    if (toExpire.length === 0) {
      return 0;
    }

    const ids = toExpire.map((a) => a.id);
    const expiredCount = await this.amberAlertRepo.bulkExpire(ids);

    // Audit bulk expiration
    await this.auditRepo.create({
      entityType: "amber_alert",
      entityId: "bulk",
      officerId: "system",
      action: "update",
      success: true,
      details: {
        autoExpired: true,
        count: expiredCount,
        maxDaysActive,
      },
    });

    return expiredCount;
  }

  // =======================
  // WANTED PERSON METHODS
  // =======================

  /**
   * Validate Wanted Person data
   */
  private validateWantedPersonData(data: CreateWantedPersonInput | UpdateWantedPersonInput): void {
    if ("charges" in data && data.charges) {
      if (data.charges.length === 0) {
        throw new ValidationError("At least one charge is required");
      }

      data.charges.forEach((charge) => {
        if (!charge.charge || charge.charge.trim().length < 3) {
          throw new ValidationError("Each charge must have a description");
        }
      });
    }

    if ("physicalDescription" in data && data.physicalDescription) {
      if (data.physicalDescription.length < 10 || data.physicalDescription.length > 1000) {
        throw new ValidationError("Physical description must be between 10 and 1000 characters");
      }
    }

    if ("rewardAmount" in data && data.rewardAmount !== undefined && data.rewardAmount !== null) {
      if (data.rewardAmount < 0) {
        throw new ValidationError("Reward amount cannot be negative");
      }
    }

    if ("warrantNumber" in data && data.warrantNumber) {
      if (data.warrantNumber.trim().length < 3) {
        throw new ValidationError("Valid warrant number is required");
      }
    }
  }

  /**
   * Create a Wanted Person
   */
  async createWantedPerson(
    input: CreateWantedPersonInput,
    createdBy: string,
    ipAddress?: string
  ): Promise<WantedPerson> {
    // Validate
    this.validateWantedPersonData(input);

    // Verify person exists
    const person = await this.personRepo.findById(input.personId);

    if (!person) {
      throw new NotFoundError("Person not found");
    }

    // Check if warrant number is unique
    const existingWarrant = await this.wantedPersonRepo.findByWarrantNumber(
      input.warrantNumber
    );

    if (existingWarrant) {
      throw new ValidationError("Warrant number already exists");
    }

    // Prepare DTO
    const dto: CreateWantedPersonDto = {
      personId: input.personId,
      personName: `${person.firstName} ${person.lastName}`,
      nin: person.nin,
      charges: input.charges,
      dangerLevel: input.dangerLevel,
      status: "active",
      warrantNumber: input.warrantNumber,
      issuedDate: new Date(input.issuedDate),
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      lastSeenLocation: input.lastSeenLocation || null,
      lastSeenDate: input.lastSeenDate ? new Date(input.lastSeenDate) : null,
      physicalDescription: input.physicalDescription,
      photoUrl: input.photoUrl || null,
      rewardAmount: input.rewardAmount || null,
      contactPhone: input.contactPhone,
      isRegionalAlert: input.isRegionalAlert || false,
      createdById: createdBy,
    };

    // Create wanted person
    const wantedPerson = await this.wantedPersonRepo.create(dto);

    // Update Person.isWanted flag
    await this.personRepo.setWantedStatus(input.personId, true, createdBy);

    // Audit
    await this.auditRepo.create({
      entityType: "wanted_person",
      entityId: wantedPerson.id,
      officerId: createdBy,
      action: "create",
      success: true,
      details: {
        personId: input.personId,
        personName: dto.personName,
        warrantNumber: input.warrantNumber,
        dangerLevel: input.dangerLevel,
        isRegional: input.isRegionalAlert,
      },
      ipAddress,
    });

    return wantedPerson;
  }

  /**
   * Get Wanted Person by ID
   */
  async getWantedPersonById(id: string): Promise<WantedPerson> {
    const wantedPerson = await this.wantedPersonRepo.findById(id);

    if (!wantedPerson) {
      throw new NotFoundError("Wanted person not found");
    }

    return wantedPerson;
  }

  /**
   * Get Wanted Person with Person details
   */
  async getWantedPersonWithDetails(id: string): Promise<WantedPersonWithPerson> {
    const result = await this.wantedPersonRepo.findByIdWithPerson(id);

    if (!result) {
      throw new NotFoundError("Wanted person not found");
    }

    return result;
  }

  /**
   * Update Wanted Person
   */
  async updateWantedPerson(
    id: string,
    input: UpdateWantedPersonInput,
    updatedBy: string,
    ipAddress?: string
  ): Promise<WantedPerson> {
    const existing = await this.wantedPersonRepo.findById(id);

    if (!existing) {
      throw new NotFoundError("Wanted person not found");
    }

    // Cannot update captured or expired
    if (existing.status === "captured" || existing.status === "expired") {
      throw new ForbiddenError("Cannot update captured or expired wanted persons");
    }

    // Validate
    this.validateWantedPersonData(input);

    // Prepare DTO
    const dto: UpdateWantedPersonDto = {
      ...(input.charges && { charges: input.charges }),
      ...(input.dangerLevel && { dangerLevel: input.dangerLevel }),
      ...(input.lastSeenLocation !== undefined && { lastSeenLocation: input.lastSeenLocation }),
      ...(input.lastSeenDate !== undefined && { lastSeenDate: input.lastSeenDate ? new Date(input.lastSeenDate) : null }),
      ...(input.physicalDescription && { physicalDescription: input.physicalDescription }),
      ...(input.photoUrl !== undefined && { photoUrl: input.photoUrl }),
      ...(input.rewardAmount !== undefined && { rewardAmount: input.rewardAmount }),
      ...(input.contactPhone && { contactPhone: input.contactPhone }),
      ...(input.isRegionalAlert !== undefined && { isRegionalAlert: input.isRegionalAlert }),
    };

    // Update
    const wantedPerson = await this.wantedPersonRepo.update(id, dto);

    // Audit
    await this.auditRepo.create({
      entityType: "wanted_person",
      entityId: id,
      officerId: updatedBy,
      action: "update",
      success: true,
      details: {
        updatedFields: Object.keys(input),
        warrantNumber: existing.warrantNumber,
      },
      ipAddress,
    });

    return wantedPerson;
  }

  /**
   * Mark Wanted Person as captured
   */
  async markCaptured(
    id: string,
    capturedBy: string,
    ipAddress?: string
  ): Promise<WantedPerson> {
    const wantedPerson = await this.wantedPersonRepo.findById(id);

    if (!wantedPerson) {
      throw new NotFoundError("Wanted person not found");
    }

    // Validate using domain logic
    const captureCheck = wantedPerson.canBeCaptured();
    if (!captureCheck.allowed) {
      throw new ForbiddenError(captureCheck.reason!);
    }

    // Mark as captured
    const captured = await this.wantedPersonRepo.markCaptured(id);

    // Update Person.isWanted flag (if no other active warrants)
    const activeCount = await this.wantedPersonRepo.getActiveWantedCount(
      captured.personId
    );

    if (activeCount === 0) {
      // Update Person.isWanted flag - no more active warrants
      await this.personRepo.setWantedStatus(captured.personId, false, capturedBy);
    }

    // Audit
    await this.auditRepo.create({
      entityType: "wanted_person",
      entityId: id,
      officerId: capturedBy,
      action: "update",
      success: true,
      details: {
        captured: true,
        warrantNumber: captured.warrantNumber,
        personId: captured.personId,
      },
      ipAddress,
    });

    return captured;
  }

  /**
   * Get active wanted persons
   */
  async getActiveWantedPersons(limit = 100): Promise<WantedPerson[]> {
    return this.wantedPersonRepo.findActive(limit);
  }

  /**
   * Get high priority wanted persons
   */
  async getHighPriorityWanted(limit = 50): Promise<WantedPerson[]> {
    return this.wantedPersonRepo.findHighPriority(limit);
  }

  /**
   * Search wanted persons
   */
  async searchWantedPersons(
    filters: WantedPersonFilters,
    limit = 100,
    offset = 0
  ): Promise<{ wantedPersons: WantedPerson[]; total: number }> {
    const [wantedPersons, total] = await Promise.all([
      this.wantedPersonRepo.findAll(filters, limit, offset),
      this.wantedPersonRepo.count(filters),
    ]);

    return { wantedPersons, total };
  }

  /**
   * Get statistics
   */
  async getAmberAlertStatistics(
    fromDate?: Date,
    toDate?: Date
  ): Promise<AmberAlertStatistics> {
    return this.amberAlertRepo.getStatistics(fromDate, toDate);
  }

  /**
   * Get Wanted Person statistics
   */
  async getWantedPersonStatistics(
    fromDate?: Date,
    toDate?: Date
  ): Promise<WantedPersonStatistics> {
    return this.wantedPersonRepo.getStatistics(fromDate, toDate);
  }
}

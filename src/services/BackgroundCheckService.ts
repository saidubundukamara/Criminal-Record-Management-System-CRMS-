/**
 * BackgroundCheck Service
 *
 * Business logic layer for background check management
 * Handles validation, NIN lookups, criminal record checks, certificate generation, and audit logging
 *
 * Pan-African Design:
 * - Country-agnostic NIN lookup
 * - Configurable check expiration (90 days default)
 * - Redacted results for citizen/public requests
 */

import {
  IBackgroundCheckRepository,
  CreateBackgroundCheckDto,
  UpdateBackgroundCheckDto,
  BackgroundCheckFilters,
  BackgroundCheckStatistics,
} from "@/src/domain/interfaces/repositories/IBackgroundCheckRepository";
import {
  BackgroundCheck,
  BackgroundCheckStatus,
  BackgroundCheckRequestType,
  BackgroundCheckResult,
  CriminalHistoryRecord,
} from "@/src/domain/entities/BackgroundCheck";
import { IAuditLogRepository } from "@/src/domain/interfaces/repositories/IAuditLogRepository";
import { IPersonRepository } from "@/src/domain/interfaces/repositories/IPersonRepository";
import { ICaseRepository } from "@/src/domain/interfaces/repositories/ICaseRepository";
import { ValidationError, NotFoundError, ForbiddenError } from "@/src/lib/errors";

/**
 * Input for performing a background check
 */
export interface PerformBackgroundCheckInput {
  nin: string;
  requestedById?: string | null; // Null for citizen USSD requests
  requestType: BackgroundCheckRequestType;
  phoneNumber?: string | null; // For USSD requests
}

/**
 * Input for generating certificate
 */
export interface GenerateCertificateInput {
  backgroundCheckId: string;
  format?: "pdf" | "json"; // Default: pdf
}

/**
 * BackgroundCheckService class
 */
export class BackgroundCheckService {
  constructor(
    private readonly backgroundCheckRepo: IBackgroundCheckRepository,
    private readonly personRepo: IPersonRepository,
    private readonly caseRepo: ICaseRepository,
    private readonly auditRepo: IAuditLogRepository
  ) {}

  /**
   * Validate NIN format
   * Note: This is a basic check. Country-specific validation should be added.
   */
  private validateNIN(nin: string): void {
    if (!nin || nin.trim().length === 0) {
      throw new ValidationError("NIN is required");
    }

    // Basic alphanumeric check (country-specific rules can be added)
    if (nin.length < 5 || nin.length > 30) {
      throw new ValidationError("NIN must be between 5 and 30 characters");
    }

    // Check for valid characters (alphanumeric, hyphens, slashes)
    if (!/^[A-Z0-9\-\/]+$/i.test(nin)) {
      throw new ValidationError("NIN contains invalid characters");
    }
  }

  /**
   * Perform a background check by NIN
   */
  async performBackgroundCheck(
    input: PerformBackgroundCheckInput,
    ipAddress?: string
  ): Promise<BackgroundCheck> {
    // Validate NIN
    this.validateNIN(input.nin);

    // Check if there's a recent check for this NIN (within 24 hours)
    // This prevents abuse and reduces load
    if (input.requestType !== "officer") {
      const hasRecentCheck = await this.backgroundCheckRepo.hasRecentCheck(
        input.nin,
        24
      );

      if (hasRecentCheck) {
        throw new ForbiddenError(
          "A background check for this NIN was performed recently. Please try again later."
        );
      }
    }

    // Look up person by NIN
    const person = await this.personRepo.findByNIN(input.nin);

    // Prepare result
    let result: BackgroundCheckResult;

    if (!person) {
      // NIN not found in system
      result = {
        status: "clear",
        message: "No records found for this NIN",
        lastUpdated: new Date(),
      };
    } else {
      // Check for criminal cases linked to this person
      const cases = await this.caseRepo.findByPersonId(person.id);

      if (cases.length === 0) {
        // No criminal record
        result = {
          status: "clear",
          message: "No criminal records found",
          riskLevel: "low",
          lastUpdated: new Date(),
        };
      } else {
        // Has criminal record - build criminal history
        const criminalHistory: CriminalHistoryRecord[] = cases.map((c) => ({
          caseNumber: c.caseNumber,
          category: c.category,
          severity: c.severity,
          status: c.status,
          incidentDate: c.incidentDate,
          outcome: c.status === "closed" ? "Closed" : "Ongoing",
        }));

        // Calculate risk level based on case severity
        const hasCritical = cases.some((c) => c.severity === "critical");
        const hasMajor = cases.some((c) => c.severity === "major");

        let riskLevel: "low" | "medium" | "high";
        if (hasCritical) {
          riskLevel = "high";
        } else if (hasMajor) {
          riskLevel = "medium";
        } else {
          riskLevel = "low";
        }

        result = {
          status: "record_found",
          message: `${cases.length} criminal record(s) found`,
          recordsCount: cases.length,
          criminalHistory,
          riskLevel,
          lastUpdated: new Date(),
        };
      }
    }

    // Calculate expiration date (90 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    // Prepare DTO
    const dto: CreateBackgroundCheckDto = {
      nin: input.nin,
      requestedById: input.requestedById || null,
      requestType: input.requestType,
      result,
      status: "completed",
      issuedAt: new Date(),
      expiresAt,
      certificateUrl: null, // Generated separately
      phoneNumber: input.phoneNumber || null,
      ipAddress,
    };

    // Create background check record
    const backgroundCheck = await this.backgroundCheckRepo.create(dto);

    // Audit the check
    await this.auditRepo.create({
      entityType: "background_check",
      entityId: backgroundCheck.id,
      officerId: input.requestedById || "system",
      action: "create",
      success: true,
      details: {
        nin: input.nin,
        requestType: input.requestType,
        result: result.status,
        recordsCount: result.recordsCount || 0,
        phoneNumber: input.phoneNumber,
      },
      ipAddress,
    });

    return backgroundCheck;
  }

  /**
   * Get background check by ID
   */
  async getBackgroundCheckById(
    id: string,
    requestingOfficerId: string
  ): Promise<BackgroundCheck> {
    const backgroundCheck = await this.backgroundCheckRepo.findById(id);

    if (!backgroundCheck) {
      throw new NotFoundError("Background check not found");
    }

    // Audit access
    await this.auditRepo.create({
      entityType: "background_check",
      entityId: id,
      officerId: requestingOfficerId,
      action: "read",
      success: true,
      details: {
        nin: backgroundCheck.nin,
        requestType: backgroundCheck.requestType,
      },
    });

    return backgroundCheck;
  }

  /**
   * Get background check result (with redaction if needed)
   */
  async getResult(
    id: string,
    requestingOfficerId?: string
  ): Promise<BackgroundCheckResult> {
    const backgroundCheck = await this.backgroundCheckRepo.findById(id);

    if (!backgroundCheck) {
      throw new NotFoundError("Background check not found");
    }

    // Check if expired
    if (backgroundCheck.isExpired()) {
      throw new ForbiddenError("Background check result has expired");
    }

    // Return redacted or full result based on request type
    if (requestingOfficerId && backgroundCheck.isOfficerRequest()) {
      // Full result for officer requests
      return backgroundCheck.result;
    } else {
      // Redacted result for citizen/public requests
      return backgroundCheck.getRedactedResult();
    }
  }

  /**
   * Search background checks
   */
  async searchBackgroundChecks(
    filters: BackgroundCheckFilters,
    limit = 100,
    offset = 0
  ): Promise<{ checks: BackgroundCheck[]; total: number }> {
    const [checks, total] = await Promise.all([
      this.backgroundCheckRepo.findAll(filters, limit, offset),
      this.backgroundCheckRepo.count(filters),
    ]);

    return { checks, total };
  }

  /**
   * Get check history for a NIN
   */
  async getCheckHistory(
    nin: string,
    requestingOfficerId: string
  ): Promise<BackgroundCheck[]> {
    this.validateNIN(nin);

    const history = await this.backgroundCheckRepo.getCheckHistory(nin, 50);

    // Audit access
    await this.auditRepo.create({
      entityType: "background_check",
      entityId: "history",
      officerId: requestingOfficerId,
      action: "read",
      success: true,
      details: {
        nin,
        historyCount: history.length,
      },
    });

    return history;
  }

  /**
   * Generate certificate for visa/employer requests
   */
  async generateCertificate(
    input: GenerateCertificateInput,
    requestingOfficerId: string
  ): Promise<BackgroundCheck> {
    const backgroundCheck = await this.backgroundCheckRepo.findById(
      input.backgroundCheckId
    );

    if (!backgroundCheck) {
      throw new NotFoundError("Background check not found");
    }

    // Validate can generate certificate
    if (!backgroundCheck.canGenerateCertificate()) {
      throw new ForbiddenError("Certificate cannot be generated for this check");
    }

    // TODO: Implement PDF generation here
    // For now, we'll create a placeholder URL
    const certificateUrl = `/certificates/bgcheck-${backgroundCheck.id}.pdf`;

    // Update background check with certificate URL
    const updated = await this.backgroundCheckRepo.updateCertificate(
      backgroundCheck.id,
      certificateUrl
    );

    // Audit certificate generation
    await this.auditRepo.create({
      entityType: "background_check",
      entityId: backgroundCheck.id,
      officerId: requestingOfficerId,
      action: "update",
      success: true,
      details: {
        nin: backgroundCheck.nin,
        certificateGenerated: true,
        certificateUrl,
      },
    });

    return updated;
  }

  /**
   * Delete background check
   */
  async deleteBackgroundCheck(
    id: string,
    deletedBy: string,
    ipAddress?: string
  ): Promise<void> {
    const backgroundCheck = await this.backgroundCheckRepo.findById(id);

    if (!backgroundCheck) {
      throw new NotFoundError("Background check not found");
    }

    // Only allow deletion of failed or old checks (admin only)
    if (
      backgroundCheck.status !== "failed" &&
      backgroundCheck.getAgeInDays() < 365
    ) {
      throw new ForbiddenError(
        "Can only delete failed checks or checks older than 1 year"
      );
    }

    await this.backgroundCheckRepo.delete(id);

    // Audit deletion
    await this.auditRepo.create({
      entityType: "background_check",
      entityId: id,
      officerId: deletedBy,
      action: "delete",
      success: true,
      details: {
        nin: backgroundCheck.nin,
        requestType: backgroundCheck.requestType,
      },
      ipAddress,
    });
  }

  /**
   * Get statistics
   */
  async getStatistics(
    fromDate?: Date,
    toDate?: Date
  ): Promise<BackgroundCheckStatistics> {
    return this.backgroundCheckRepo.getStatistics(fromDate, toDate);
  }

  /**
   * Get checks expiring soon
   */
  async getExpiringSoon(withinDays = 7): Promise<BackgroundCheck[]> {
    return this.backgroundCheckRepo.findExpiringSoon(withinDays, 100);
  }

  /**
   * Get recent checks with criminal records (for monitoring)
   */
  async getRecentChecksWithRecords(limit = 50): Promise<BackgroundCheck[]> {
    return this.backgroundCheckRepo.findWithRecords(limit, 0);
  }
}

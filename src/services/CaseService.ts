/**
 * Case Service
 *
 * Handles all case management business logic:
 * - Case creation, update, deletion
 * - Status workflow validation
 * - Case assignment
 * - Statistics and reporting
 *
 * Pan-African Design: Supports any country's case workflows and legal frameworks
 */
import { ICaseRepository, CreateCaseDto, UpdateCaseDto, CaseFilters } from "@/src/domain/interfaces/repositories/ICaseRepository";
import { IAuditLogRepository } from "@/src/domain/interfaces/repositories/IAuditLogRepository";
import { Case, CaseStatus } from "@/src/domain/entities/Case";
import { ValidationError, NotFoundError, ForbiddenError } from "@/src/lib/errors";

export interface CreateCaseInput {
  title: string;
  description?: string;
  category: string;
  severity: string;
  incidentDate: Date | string;
  location?: string;
  stationId: string;
  officerId: string;
}

export interface UpdateCaseInput {
  title?: string;
  description?: string;
  category?: string;
  severity?: string;
  location?: string;
}

export class CaseService {
  constructor(
    private readonly caseRepo: ICaseRepository,
    private readonly auditRepo: IAuditLogRepository
  ) {}

  /**
   * Create a new case
   * Validates input and generates unique case number
   */
  async createCase(
    data: CreateCaseInput,
    createdBy: string,
    ipAddress?: string
  ): Promise<Case> {
    // Validation
    this.validateCaseInput(data);

    // Convert incidentDate to Date if string
    const incidentDate =
      typeof data.incidentDate === "string"
        ? new Date(data.incidentDate)
        : data.incidentDate;

    // Validate incident date is not in the future
    if (incidentDate > new Date()) {
      throw new ValidationError("Incident date cannot be in the future");
    }

    // Create case
    const caseData: CreateCaseDto = {
      title: data.title,
      description: data.description,
      category: data.category as any,
      severity: data.severity as any,
      incidentDate,
      location: data.location,
      stationId: data.stationId,
      officerId: data.officerId,
    };

    const newCase = await this.caseRepo.create(caseData);

    // Audit log
    await this.auditRepo.create({
      entityType: "case",
      entityId: newCase.id,
      officerId: createdBy,
      action: "create",
      success: true,
      details: {
        caseNumber: newCase.caseNumber,
        title: newCase.title,
        category: newCase.category,
        severity: newCase.severity,
      },
      ipAddress,
    });

    return newCase;
  }

  /**
   * Get case by ID
   */
  async getCaseById(
    id: string,
    officerId: string,
    includeRelations = false
  ): Promise<Case> {
    const caseData = await this.caseRepo.findById(id, includeRelations);

    if (!caseData) {
      throw new NotFoundError("Case not found");
    }

    // Audit read access
    await this.auditRepo.create({
      entityType: "case",
      entityId: id,
      officerId,
      action: "read",
      success: true,
      details: { caseNumber: caseData.caseNumber },
    });

    return caseData;
  }

  /**
   * Get case by case number
   */
  async getCaseByCaseNumber(
    caseNumber: string,
    officerId: string
  ): Promise<Case> {
    const caseData = await this.caseRepo.findByCaseNumber(caseNumber);

    if (!caseData) {
      throw new NotFoundError("Case not found");
    }

    // Audit read access
    await this.auditRepo.create({
      entityType: "case",
      entityId: caseData.id,
      officerId,
      action: "read",
      success: true,
      details: { caseNumber },
    });

    return caseData;
  }

  /**
   * List cases with filters
   */
  async listCases(
    filters: CaseFilters,
    officerId: string
  ): Promise<Case[]> {
    const cases = await this.caseRepo.findAll(filters);

    // Audit list access (summary log)
    await this.auditRepo.create({
      entityType: "case",
      officerId,
      action: "read",
      success: true,
      details: {
        action: "list_cases",
        filters,
        resultCount: cases.length,
      },
    });

    return cases;
  }

  /**
   * Update case
   * Validates that status transitions follow workflow rules
   */
  async updateCase(
    id: string,
    data: UpdateCaseInput,
    updatedBy: string,
    ipAddress?: string
  ): Promise<Case> {
    // Get existing case
    const existingCase = await this.caseRepo.findById(id);
    if (!existingCase) {
      throw new NotFoundError("Case not found");
    }

    // Validate case is not closed (cannot update closed cases)
    if (existingCase.status === "closed") {
      throw new ForbiddenError("Cannot update a closed case");
    }

    // Validate input if provided
    if (data.title || data.category || data.severity) {
      this.validateCaseInput(data as any);
    }

    // Update case
    const updateData: UpdateCaseDto = {
      title: data.title,
      description: data.description,
      category: data.category as any,
      severity: data.severity as any,
      location: data.location,
    };

    const updatedCase = await this.caseRepo.update(id, updateData);

    // Audit log
    await this.auditRepo.create({
      entityType: "case",
      entityId: id,
      officerId: updatedBy,
      action: "update",
      success: true,
      details: {
        caseNumber: updatedCase.caseNumber,
        changes: data,
      },
      ipAddress,
    });

    return updatedCase;
  }

  /**
   * Update case status
   * Validates status transition using domain logic
   */
  async updateCaseStatus(
    id: string,
    newStatus: CaseStatus,
    updatedBy: string,
    reason?: string,
    ipAddress?: string
  ): Promise<Case> {
    // Get existing case
    const existingCase = await this.caseRepo.findById(id);
    if (!existingCase) {
      throw new NotFoundError("Case not found");
    }

    // Validate status transition using domain logic
    const transitionCheck = existingCase.canTransitionTo(newStatus);
    if (!transitionCheck.allowed) {
      throw new ForbiddenError(transitionCheck.reason!);
    }

    // Update status
    const updatedCase = await this.caseRepo.updateStatus(id, newStatus);

    // Audit log
    await this.auditRepo.create({
      entityType: "case",
      entityId: id,
      officerId: updatedBy,
      action: "status_change",
      success: true,
      details: {
        caseNumber: updatedCase.caseNumber,
        oldStatus: existingCase.status,
        newStatus,
        reason,
      },
      ipAddress,
    });

    return updatedCase;
  }

  /**
   * Assign case to a different officer
   */
  async assignOfficer(
    caseId: string,
    newOfficerId: string,
    assignedBy: string,
    ipAddress?: string
  ): Promise<Case> {
    // Get existing case
    const existingCase = await this.caseRepo.findById(caseId);
    if (!existingCase) {
      throw new NotFoundError("Case not found");
    }

    // Cannot reassign closed cases
    if (existingCase.status === "closed") {
      throw new ForbiddenError("Cannot reassign a closed case");
    }

    // Assign to new officer
    const updatedCase = await this.caseRepo.assignOfficer(caseId, newOfficerId);

    // Audit log
    await this.auditRepo.create({
      entityType: "case",
      entityId: caseId,
      officerId: assignedBy,
      action: "assign_officer",
      success: true,
      details: {
        caseNumber: updatedCase.caseNumber,
        oldOfficerId: existingCase.officerId,
        newOfficerId,
      },
      ipAddress,
    });

    return updatedCase;
  }

  /**
   * Close a case
   */
  async closeCase(
    caseId: string,
    closedBy: string,
    reason?: string,
    ipAddress?: string
  ): Promise<Case> {
    return this.updateCaseStatus(caseId, "closed", closedBy, reason, ipAddress);
  }

  /**
   * Delete a case (soft delete by marking as inactive)
   * Only allowed for cases that haven't been charged yet
   */
  async deleteCase(
    id: string,
    deletedBy: string,
    reason?: string,
    ipAddress?: string
  ): Promise<void> {
    // Get existing case
    const existingCase = await this.caseRepo.findById(id);
    if (!existingCase) {
      throw new NotFoundError("Case not found");
    }

    // Validate deletion is allowed
    // Only open or investigating cases can be deleted
    if (
      existingCase.status !== "open" &&
      existingCase.status !== "investigating"
    ) {
      throw new ForbiddenError(
        "Cannot delete cases that have been charged or are in court"
      );
    }

    // Audit before deletion
    await this.auditRepo.create({
      entityType: "case",
      entityId: id,
      officerId: deletedBy,
      action: "delete",
      success: true,
      details: {
        caseNumber: existingCase.caseNumber,
        status: existingCase.status,
        reason,
      },
      ipAddress,
    });

    // Delete case
    await this.caseRepo.delete(id);
  }

  /**
   * Get case statistics by status
   */
  async getCaseStatsByStatus(stationId?: string): Promise<Record<CaseStatus, number>> {
    return await this.caseRepo.getCountByStatus(stationId);
  }

  /**
   * Get case statistics by severity
   */
  async getCaseStatsBySeverity(stationId?: string): Promise<any> {
    return await this.caseRepo.getCountBySeverity(stationId);
  }

  /**
   * Get stale cases (no updates in X days)
   */
  async getStaleCases(stationId?: string, days = 30): Promise<Case[]> {
    return await this.caseRepo.getStaleCases(stationId, days);
  }

  /**
   * Search cases
   */
  async searchCases(
    query: string,
    stationId?: string,
    officerId?: string
  ): Promise<Case[]> {
    const filters: CaseFilters = {
      search: query,
      stationId,
      officerId,
      limit: 50,
    };

    return await this.caseRepo.findAll(filters);
  }

  /**
   * Validate case input data
   */
  private validateCaseInput(data: Partial<CreateCaseInput>): void {
    if (data.title) {
      if (data.title.length < 5) {
        throw new ValidationError("Case title must be at least 5 characters");
      }
      if (data.title.length > 200) {
        throw new ValidationError("Case title must not exceed 200 characters");
      }
    }

    if (data.description && data.description.length > 5000) {
      throw new ValidationError("Case description must not exceed 5000 characters");
    }

    if (data.category) {
      const validCategories = [
        "theft",
        "assault",
        "fraud",
        "murder",
        "robbery",
        "kidnapping",
        "drug",
        "cybercrime",
        "domestic_violence",
        "burglary",
        "arson",
        "other",
      ];
      if (!validCategories.includes(data.category)) {
        throw new ValidationError("Invalid case category");
      }
    }

    if (data.severity) {
      const validSeverities = ["minor", "major", "critical"];
      if (!validSeverities.includes(data.severity)) {
        throw new ValidationError("Invalid severity level");
      }
    }
  }
}

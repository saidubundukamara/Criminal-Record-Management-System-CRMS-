/**
 * Evidence Service
 *
 * Business logic layer for evidence management
 * Handles validation, S3 uploads, QR codes, chain of custody, and audit logging
 */

import {
  IEvidenceRepository,
  CreateEvidenceDto,
  UpdateEvidenceDto,
  EvidenceFilters,
  EvidenceWithCase,
  EvidenceStatistics,
} from "@/src/domain/interfaces/repositories/IEvidenceRepository";
import { Evidence, EvidenceType, EvidenceStatus, CustodyEvent } from "@/src/domain/entities/Evidence";
import { IAuditLogRepository } from "@/src/domain/interfaces/repositories/IAuditLogRepository";
import { ValidationError, NotFoundError, ForbiddenError } from "@/src/lib/errors";

/**
 * Input for creating evidence (service layer)
 */
export interface CreateEvidenceInput {
  caseId: string;
  type: EvidenceType;
  description: string;
  status?: EvidenceStatus;
  collectedDate: string; // ISO string
  collectedLocation: string;
  storageLocation?: string;
  tags?: string[];
  notes?: string;
  file?: {
    url: string;
    key?: string; // S3 key for file operations
    name: string;
    size: number;
    mimeType: string;
    hash: string;
  };
}

/**
 * Input for updating evidence
 */
export interface UpdateEvidenceInput {
  type?: EvidenceType;
  description?: string;
  collectedLocation?: string;
  storageLocation?: string;
  tags?: string[];
  notes?: string;
}

/**
 * Input for adding custody event
 */
export interface AddCustodyEventInput {
  action: "collected" | "transferred" | "accessed" | "returned" | "destroyed";
  location: string;
  notes?: string;
}

/**
 * EvidenceService class
 */
export class EvidenceService {
  constructor(
    private readonly evidenceRepo: IEvidenceRepository,
    private readonly auditRepo: IAuditLogRepository
  ) {}

  /**
   * Validate evidence data
   */
  private validateEvidenceData(data: CreateEvidenceInput | UpdateEvidenceInput): void {
    if ("description" in data && data.description) {
      if (data.description.length < 10 || data.description.length > 1000) {
        throw new ValidationError("Description must be between 10 and 1000 characters");
      }
    }

    if ("type" in data && data.type) {
      const validTypes: EvidenceType[] = [
        "physical",
        "document",
        "photo",
        "video",
        "audio",
        "digital",
        "biological",
        "other",
      ];
      if (!validTypes.includes(data.type)) {
        throw new ValidationError("Invalid evidence type");
      }
    }

    if ("tags" in data && data.tags) {
      data.tags.forEach((tag) => {
        if (tag.length < 2 || tag.length > 30) {
          throw new ValidationError("Each tag must be between 2 and 30 characters");
        }
      });
    }
  }

  /**
   * Get evidence by ID
   */
  async getEvidenceById(id: string, requestingOfficerId: string): Promise<Evidence> {
    const evidence = await this.evidenceRepo.findById(id);

    if (!evidence) {
      throw new NotFoundError("Evidence not found");
    }

    // Audit read operation
    await this.auditRepo.create({
      entityType: "evidence",
      entityId: id,
      officerId: requestingOfficerId,
      action: "read",
      success: true,
      details: { qrCode: evidence.qrCode, type: evidence.type },
    });

    return evidence;
  }

  /**
   * Get evidence by QR code
   */
  async getEvidenceByQRCode(
    qrCode: string,
    requestingOfficerId: string
  ): Promise<Evidence | null> {
    const evidence = await this.evidenceRepo.findByQRCode(qrCode);

    if (evidence) {
      // Audit QR scan
      await this.auditRepo.create({
        entityType: "evidence",
        entityId: evidence.id,
        officerId: requestingOfficerId,
        action: "read",
        success: true,
        details: { scanType: "qr", qrCode },
      });
    }

    return evidence;
  }

  /**
   * Get evidence with case information
   */
  async getEvidenceWithCase(
    id: string,
    requestingOfficerId: string
  ): Promise<EvidenceWithCase> {
    const evidence = await this.evidenceRepo.findByIdWithCase(id);

    if (!evidence) {
      throw new NotFoundError("Evidence not found");
    }

    // Audit read operation
    await this.auditRepo.create({
      entityType: "evidence",
      entityId: id,
      officerId: requestingOfficerId,
      action: "read",
      success: true,
      details: { qrCode: evidence.qrCode, caseNumber: evidence.case.caseNumber },
    });

    return evidence;
  }

  /**
   * Search evidence
   */
  async searchEvidence(
    filters: EvidenceFilters,
    requestingOfficerId: string,
    limit = 100,
    offset = 0
  ): Promise<{ evidence: Evidence[]; total: number }> {
    const [evidence, total] = await Promise.all([
      this.evidenceRepo.findAll(filters, limit, offset),
      this.evidenceRepo.count(filters),
    ]);

    return { evidence, total };
  }

  /**
   * Create new evidence
   */
  async createEvidence(
    input: CreateEvidenceInput,
    collectedBy: string,
    stationId: string,
    officerDetails: { name: string; badge: string },
    ipAddress?: string
  ): Promise<Evidence> {
    // Validate input
    this.validateEvidenceData(input);

    // Generate unique QR code
    const qrCode = await this.evidenceRepo.generateQRCode(stationId);

    // Initial custody event
    const initialCustodyEvent: CustodyEvent = {
      officerId: collectedBy,
      officerName: officerDetails.name,
      officerBadge: officerDetails.badge,
      action: "collected",
      timestamp: new Date(input.collectedDate),
      location: input.collectedLocation,
      notes: `Initial collection of ${input.type} evidence`,
    };

    // Prepare DTO
    const dto: CreateEvidenceDto = {
      qrCode,
      caseId: input.caseId,
      type: input.type,
      description: input.description,
      status: input.status || "collected",
      collectedDate: new Date(input.collectedDate),
      collectedLocation: input.collectedLocation,
      collectedBy,
      fileUrl: input.file?.url || null,
      fileKey: input.file?.key || null,
      fileName: input.file?.name || null,
      fileSize: input.file?.size || null,
      fileMimeType: input.file?.mimeType || null,
      fileHash: input.file?.hash || null,
      storageLocation: input.storageLocation || null,
      chainOfCustody: [initialCustodyEvent],
      tags: input.tags || [],
      notes: input.notes || null,
      stationId,
    };

    // Create evidence
    const evidence = await this.evidenceRepo.create(dto);

    // Audit creation
    await this.auditRepo.create({
      entityType: "evidence",
      entityId: evidence.id,
      officerId: collectedBy,
      action: "create",
      success: true,
      details: {
        qrCode: evidence.qrCode,
        type: evidence.type,
        caseId: evidence.caseId,
        hasFile: evidence.isDigital(),
      },
      ipAddress,
    });

    return evidence;
  }

  /**
   * Update evidence
   */
  async updateEvidence(
    id: string,
    input: UpdateEvidenceInput,
    updatedBy: string,
    ipAddress?: string
  ): Promise<Evidence> {
    // Check if evidence exists
    const existing = await this.evidenceRepo.findById(id);
    if (!existing) {
      throw new NotFoundError("Evidence not found");
    }

    // Cannot update destroyed evidence
    if (existing.status === "destroyed") {
      throw new ForbiddenError("Cannot update destroyed evidence");
    }

    // Validate input
    this.validateEvidenceData(input);

    // Prepare DTO
    const dto: UpdateEvidenceDto = {
      ...(input.type && { type: input.type }),
      ...(input.description && { description: input.description }),
      ...(input.collectedLocation !== undefined && { collectedLocation: input.collectedLocation }),
      ...(input.storageLocation !== undefined && { storageLocation: input.storageLocation }),
      ...(input.tags && { tags: input.tags }),
      ...(input.notes !== undefined && { notes: input.notes }),
    };

    // Update evidence
    const evidence = await this.evidenceRepo.update(id, dto);

    // Audit update
    await this.auditRepo.create({
      entityType: "evidence",
      entityId: id,
      officerId: updatedBy,
      action: "update",
      success: true,
      details: {
        qrCode: evidence.qrCode,
        updatedFields: Object.keys(input),
      },
      ipAddress,
    });

    return evidence;
  }

  /**
   * Delete evidence
   */
  async deleteEvidence(id: string, deletedBy: string, ipAddress?: string): Promise<void> {
    // Check if evidence exists
    const evidence = await this.evidenceRepo.findById(id);
    if (!evidence) {
      throw new NotFoundError("Evidence not found");
    }

    // Can only delete if in collected or stored status
    if (!["collected", "stored"].includes(evidence.status)) {
      throw new ForbiddenError(
        "Can only delete evidence in collected or stored status"
      );
    }

    // Delete evidence
    await this.evidenceRepo.delete(id);

    // Audit deletion
    await this.auditRepo.create({
      entityType: "evidence",
      entityId: id,
      officerId: deletedBy,
      action: "delete",
      success: true,
      details: {
        qrCode: evidence.qrCode,
        type: evidence.type,
      },
      ipAddress,
    });
  }

  /**
   * Update evidence status
   */
  async updateEvidenceStatus(
    id: string,
    newStatus: EvidenceStatus,
    updatedBy: string,
    reason?: string,
    ipAddress?: string
  ): Promise<Evidence> {
    const evidence = await this.evidenceRepo.findById(id);
    if (!evidence) {
      throw new NotFoundError("Evidence not found");
    }

    // Validate using domain logic
    const transitionCheck = evidence.canTransitionTo(newStatus);
    if (!transitionCheck.allowed) {
      throw new ForbiddenError(transitionCheck.reason!);
    }

    // Update status
    const updatedEvidence = await this.evidenceRepo.updateStatus(id, newStatus);

    // Audit
    await this.auditRepo.create({
      entityType: "evidence",
      entityId: id,
      officerId: updatedBy,
      action: "update",
      success: true,
      details: {
        qrCode: evidence.qrCode,
        previousStatus: evidence.status,
        newStatus,
        reason,
      },
      ipAddress,
    });

    return updatedEvidence;
  }

  /**
   * Add custody event
   */
  async addCustodyEvent(
    id: string,
    input: AddCustodyEventInput,
    officerId: string,
    officerDetails: { name: string; badge: string },
    ipAddress?: string
  ): Promise<Evidence> {
    const evidence = await this.evidenceRepo.findById(id);
    if (!evidence) {
      throw new NotFoundError("Evidence not found");
    }

    const custodyEvent: CustodyEvent = {
      officerId,
      officerName: officerDetails.name,
      officerBadge: officerDetails.badge,
      action: input.action,
      timestamp: new Date(),
      location: input.location,
      notes: input.notes,
    };

    const updatedEvidence = await this.evidenceRepo.addCustodyEvent(id, custodyEvent);

    // Audit
    await this.auditRepo.create({
      entityType: "evidence",
      entityId: id,
      officerId,
      action: "update",
      success: true,
      details: {
        qrCode: evidence.qrCode,
        custodyAction: input.action,
        location: input.location,
      },
      ipAddress,
    });

    return updatedEvidence;
  }

  /**
   * Seal evidence
   */
  async sealEvidence(
    id: string,
    sealedBy: string,
    ipAddress?: string
  ): Promise<Evidence> {
    const evidence = await this.evidenceRepo.findById(id);
    if (!evidence) {
      throw new NotFoundError("Evidence not found");
    }

    if (evidence.isSealed) {
      throw new ForbiddenError("Evidence is already sealed");
    }

    const sealedEvidence = await this.evidenceRepo.sealEvidence(id, sealedBy);

    // Audit
    await this.auditRepo.create({
      entityType: "evidence",
      entityId: id,
      officerId: sealedBy,
      action: "update",
      success: true,
      details: {
        qrCode: evidence.qrCode,
        sealed: true,
      },
      ipAddress,
    });

    return sealedEvidence;
  }

  /**
   * Get evidence by case
   */
  async getEvidenceByCaseId(caseId: string): Promise<Evidence[]> {
    return this.evidenceRepo.findByCaseId(caseId);
  }

  /**
   * Get statistics
   */
  async getStatistics(stationId?: string): Promise<EvidenceStatistics> {
    return this.evidenceRepo.getStatistics(stationId);
  }

  /**
   * Get stale evidence
   */
  async getStaleEvidence(maxDays = 365, stationId?: string): Promise<Evidence[]> {
    return this.evidenceRepo.getStaleEvidence(maxDays, stationId);
  }

  /**
   * Get critical evidence
   */
  async getCriticalEvidence(stationId?: string): Promise<Evidence[]> {
    return this.evidenceRepo.getCriticalEvidence(stationId);
  }
}

/**
 * Evidence Repository Implementation
 *
 * Implements IEvidenceRepository with Prisma ORM
 * Handles evidence storage, chain of custody, and QR code generation
 */

import { BaseRepository } from "../base/BaseRepository";
import {
  IEvidenceRepository,
  CreateEvidenceDto,
  UpdateEvidenceDto,
  EvidenceFilters,
  EvidenceWithCase,
  EvidenceStatistics,
} from "@/src/domain/interfaces/repositories/IEvidenceRepository";
import { Evidence, EvidenceType, EvidenceStatus, CustodyEvent } from "@/src/domain/entities/Evidence";
import { Prisma } from "@prisma/client";

/**
 * Type for Prisma Evidence with relations
 */
type PrismaEvidenceWithCase = Prisma.EvidenceGetPayload<{
  include: {
    case: true;
  };
}>;

/**
 * EvidenceRepository implementation using Prisma
 */
export class EvidenceRepository extends BaseRepository implements IEvidenceRepository {
  /**
   * Map Prisma Evidence to domain entity
   */
  private toDomain(data: any): Evidence {
    return new Evidence(
      data.id,
      data.qrCode,
      data.caseId,
      data.type as EvidenceType,
      data.description,
      data.status as EvidenceStatus,
      new Date(data.collectedDate),
      data.collectedLocation,
      data.collectedById, // Prisma field name
      data.storageUrl, // Prisma field name
      data.fileKey,
      data.fileName,
      data.fileSize,
      data.mimeType, // Prisma field name
      data.fileHash,
      data.storageLocation,
      data.chainOfCustody as CustodyEvent[],
      data.tags as string[],
      data.notes,
      data.isSealed,
      data.sealedAt ? new Date(data.sealedAt) : null,
      data.sealedBy,
      data.stationId,
      new Date(data.createdAt),
      new Date(data.updatedAt)
    );
  }

  /**
   * Map Prisma Evidence with case to domain entity
   */
  private toWithCase(data: PrismaEvidenceWithCase): EvidenceWithCase {
    const evidence = this.toDomain(data);

    // Add case property to the Evidence instance
    (evidence as any).case = {
      caseNumber: data.case.caseNumber,
      title: data.case.title,
      status: data.case.status,
    };

    return evidence as EvidenceWithCase;
  }

  /**
   * Build Prisma where clause from filters
   */
  private buildWhereClause(filters?: EvidenceFilters): Prisma.EvidenceWhereInput {
    if (!filters) return {};

    const where: any = {};

    if (filters.search) {
      where.OR = [
        { description: { contains: filters.search, mode: "insensitive" } },
        { qrCode: { contains: filters.search, mode: "insensitive" } },
        { tags: { has: filters.search } } as any,
      ];
    }

    if (filters.caseId) {
      where.caseId = filters.caseId;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.collectedBy) {
      where.collectedBy = filters.collectedBy;
    }

    if (filters.isSealed !== undefined) {
      where.isSealed = filters.isSealed;
    }

    if (filters.isDigital !== undefined) {
      where.storageUrl = filters.isDigital ? { not: null } : null; // Use Prisma field name
    }

    if (filters.stationId) {
      where.stationId = filters.stationId;
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasEvery: filters.tags };
    }

    if (filters.collectedAfter) {
      where.collectedDate = { gte: filters.collectedAfter };
    }

    if (filters.collectedBefore) {
      where.collectedDate = { ...where.collectedDate, lte: filters.collectedBefore };
    }

    if (filters.collectedLocation) {
      where.collectedLocation = { contains: filters.collectedLocation, mode: "insensitive" };
    }

    return where;
  }

  /**
   * Find evidence by ID
   */
  async findById(id: string): Promise<Evidence | null> {
    const data = await this.prisma.evidence.findUnique({
      where: { id },
    });

    return data ? this.toDomain(data) : null;
  }

  /**
   * Find evidence by QR code
   */
  async findByQRCode(qrCode: string): Promise<Evidence | null> {
    const data = await this.prisma.evidence.findUnique({
      where: { qrCode },
    });

    return data ? this.toDomain(data) : null;
  }

  /**
   * Find evidence by ID with case information
   */
  async findByIdWithCase(id: string): Promise<EvidenceWithCase | null> {
    const data = await this.prisma.evidence.findUnique({
      where: { id },
      include: {
        case: true,
      },
    });

    return data ? this.toWithCase(data) : null;
  }

  /**
   * Find all evidence matching filters
   */
  async findAll(filters?: EvidenceFilters, limit = 100, offset = 0): Promise<Evidence[]> {
    const where = this.buildWhereClause(filters);

    const data = await this.prisma.evidence.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: {
        collectedDate: "desc",
      },
    });

    return data.map((d) => this.toDomain(d));
  }

  /**
   * Find evidence by case ID
   */
  async findByCaseId(caseId: string): Promise<Evidence[]> {
    const data = await this.prisma.evidence.findMany({
      where: { caseId },
      orderBy: {
        collectedDate: "desc",
      },
    });

    return data.map((d) => this.toDomain(d));
  }

  /**
   * Find evidence by officer
   */
  async findByOfficer(officerId: string, limit = 50): Promise<Evidence[]> {
    const data = await this.prisma.evidence.findMany({
      where: { collectedById: officerId }, // Use Prisma field name
      take: limit,
      orderBy: {
        collectedDate: "desc",
      },
    });

    return data.map((d) => this.toDomain(d));
  }

  /**
   * Search evidence
   */
  async search(query: string, limit = 20): Promise<Evidence[]> {
    const data = await this.prisma.evidence.findMany({
      where: {
        OR: [
          { description: { contains: query, mode: "insensitive" } },
          { qrCode: { contains: query, mode: "insensitive" } },
          { tags: { has: query } } as any,
        ],
      },
      take: limit,
      orderBy: [
        { status: "asc" } as any,
        { collectedDate: "desc" },
      ],
    });

    return data.map((d) => this.toDomain(d));
  }

  /**
   * Get stale evidence
   */
  async getStaleEvidence(maxDays = 365, stationId?: string): Promise<Evidence[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxDays);

    const where: any = {
      collectedDate: { lte: cutoffDate },
      status: {
        notIn: ["court", "destroyed", "returned"],
      },
    };

    if (stationId) {
      where.stationId = stationId;
    }

    const data = await this.prisma.evidence.findMany({
      where,
      orderBy: {
        collectedDate: "asc",
      },
    });

    return data.map((d) => this.toDomain(d));
  }

  /**
   * Get destroyable evidence
   */
  async getDestroyableEvidence(retentionDays = 730, stationId?: string): Promise<Evidence[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const where: any = {
      collectedDate: { lte: cutoffDate },
      status: {
        notIn: ["court", "destroyed"],
      },
    };

    if (stationId) {
      where.stationId = stationId;
    }

    const data = await this.prisma.evidence.findMany({
      where,
      orderBy: {
        collectedDate: "asc",
      },
    });

    return data.map((d) => this.toDomain(d));
  }

  /**
   * Get critical evidence
   */
  async getCriticalEvidence(stationId?: string): Promise<Evidence[]> {
    const where: any = {
      OR: [
        { type: "biological" },
        { tags: { hasSome: ["critical", "high-value", "weapon"] } } as any,
      ],
      status: {
        notIn: ["destroyed", "returned"],
      },
    };

    if (stationId) {
      where.stationId = stationId;
    }

    const data = await this.prisma.evidence.findMany({
      where,
      orderBy: {
        collectedDate: "desc",
      },
    });

    return data.map((d) => this.toDomain(d));
  }

  /**
   * Create new evidence
   */
  async create(dto: CreateEvidenceDto): Promise<Evidence> {
    const data = await this.prisma.evidence.create({
      data: {
        qrCode: dto.qrCode,
        caseId: dto.caseId,
        type: dto.type,
        description: dto.description,
        status: dto.status,
        collectedDate: dto.collectedDate,
        collectedLocation: dto.collectedLocation,
        collectedById: dto.collectedBy, // Map to Prisma field name
        storageUrl: dto.fileUrl || null, // Map to Prisma field name
        fileKey: dto.fileKey || null,
        fileName: dto.fileName || null,
        fileSize: dto.fileSize || null,
        mimeType: dto.fileMimeType || null, // Map to Prisma field name
        fileHash: dto.fileHash || null,
        storageLocation: dto.storageLocation || null,
        chainOfCustody: dto.chainOfCustody,
        tags: dto.tags || [],
        notes: dto.notes || null,
        isSealed: dto.isSealed || false,
        sealedAt: dto.sealedAt || null,
        sealedBy: dto.sealedBy || null,
        stationId: dto.stationId,
      } as any,
    });

    return this.toDomain(data);
  }

  /**
   * Update existing evidence
   */
  async update(id: string, dto: UpdateEvidenceDto): Promise<Evidence> {
    const data = await this.prisma.evidence.update({
      where: { id },
      data: {
        ...(dto.type && { type: dto.type }),
        ...(dto.description && { description: dto.description }),
        ...(dto.collectedLocation !== undefined && { collectedLocation: dto.collectedLocation }),
        ...(dto.status && { status: dto.status }),
        ...(dto.fileUrl !== undefined && { storageUrl: dto.fileUrl }), // Map to Prisma field name
        ...(dto.fileName !== undefined && { fileName: dto.fileName }),
        ...(dto.fileSize !== undefined && { fileSize: dto.fileSize }),
        ...(dto.fileMimeType !== undefined && { mimeType: dto.fileMimeType }), // Map to Prisma field name
        ...(dto.fileHash !== undefined && { fileHash: dto.fileHash }),
        ...(dto.storageLocation !== undefined && { storageLocation: dto.storageLocation }),
        ...(dto.tags && { tags: dto.tags }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.isSealed !== undefined && { isSealed: dto.isSealed }),
        ...(dto.sealedAt !== undefined && { sealedAt: dto.sealedAt }),
        ...(dto.sealedBy !== undefined && { sealedBy: dto.sealedBy }),
      },
    });

    return this.toDomain(data);
  }

  /**
   * Delete evidence
   */
  async delete(id: string): Promise<void> {
    await this.prisma.evidence.delete({
      where: { id },
    });
  }

  /**
   * Update evidence status
   */
  async updateStatus(id: string, status: EvidenceStatus): Promise<Evidence> {
    const data = await this.prisma.evidence.update({
      where: { id },
      data: { status } as any,
    });

    return this.toDomain(data);
  }

  /**
   * Add custody event to chain
   */
  async addCustodyEvent(id: string, event: CustodyEvent): Promise<Evidence> {
    const evidence = await this.prisma.evidence.findUnique({ where: { id } });
    if (!evidence) {
      throw new Error("Evidence not found");
    }

    const currentChain = evidence.chainOfCustody as unknown as CustodyEvent[];
    const updatedChain = [...currentChain, event];

    const data = await this.prisma.evidence.update({
      where: { id },
      data: { chainOfCustody: updatedChain } as any,
    });

    return this.toDomain(data);
  }

  /**
   * Seal evidence
   */
  async sealEvidence(id: string, sealedBy: string): Promise<Evidence> {
    const data = await this.prisma.evidence.update({
      where: { id },
      data: {
        isSealed: true,
        sealedAt: new Date(),
        sealedBy,
      } as any,
    });

    return this.toDomain(data);
  }

  /**
   * Add tag to evidence
   */
  async addTag(id: string, tag: string): Promise<Evidence> {
    const evidence = await this.prisma.evidence.findUnique({ where: { id } });
    if (!evidence) {
      throw new Error("Evidence not found");
    }

    const currentTags = (evidence as any).tags as string[];
    if (currentTags.includes(tag)) {
      return this.toDomain(evidence); // Already exists
    }

    const data = await this.prisma.evidence.update({
      where: { id },
      data: { tags: [...currentTags, tag] } as any,
    });

    return this.toDomain(data);
  }

  /**
   * Remove tag from evidence
   */
  async removeTag(id: string, tag: string): Promise<Evidence> {
    const evidence = await this.prisma.evidence.findUnique({ where: { id } });
    if (!evidence) {
      throw new Error("Evidence not found");
    }

    const currentTags = (evidence as any).tags as string[];
    const newTags = currentTags.filter((t) => t !== tag);

    const data = await this.prisma.evidence.update({
      where: { id },
      data: { tags: newTags } as any,
    });

    return this.toDomain(data);
  }

  /**
   * Count evidence matching filters
   */
  async count(filters?: EvidenceFilters): Promise<number> {
    const where = this.buildWhereClause(filters);
    return this.prisma.evidence.count({ where });
  }

  /**
   * Get evidence statistics
   */
  async getStatistics(stationId?: string): Promise<EvidenceStatistics> {
    const where: any = stationId ? { stationId } : {};

    const [
      total,
      physical,
      document,
      photo,
      video,
      audio,
      digital,
      biological,
      other,
      collected,
      stored,
      analyzed,
      court,
      returned,
      destroyed,
      sealed,
      allEvidence,
    ] = await Promise.all([
      this.prisma.evidence.count({ where }),
      this.prisma.evidence.count({ where: { ...where, type: "physical" } }),
      this.prisma.evidence.count({ where: { ...where, type: "document" } }),
      this.prisma.evidence.count({ where: { ...where, type: "photo" } }),
      this.prisma.evidence.count({ where: { ...where, type: "video" } }),
      this.prisma.evidence.count({ where: { ...where, type: "audio" } }),
      this.prisma.evidence.count({ where: { ...where, type: "digital" } }),
      this.prisma.evidence.count({ where: { ...where, type: "biological" } }),
      this.prisma.evidence.count({ where: { ...where, type: "other" } }),
      this.prisma.evidence.count({ where: { ...where, status: "collected" } }),
      this.prisma.evidence.count({ where: { ...where, status: "stored" } }),
      this.prisma.evidence.count({ where: { ...where, status: "analyzed" } }),
      this.prisma.evidence.count({ where: { ...where, status: "court" } }),
      this.prisma.evidence.count({ where: { ...where, status: "returned" } }),
      this.prisma.evidence.count({ where: { ...where, status: "destroyed" } }),
      this.prisma.evidence.count({ where: { ...where, isSealed: true } }),
      this.prisma.evidence.findMany({
        where,
        select: {
          storageUrl: true, // Use Prisma field name
          fileSize: true,
          collectedDate: true,
          status: true,
          type: true,
          tags: true,
        },
      } as any),
    ]);

    // Calculate additional stats
    const digitalCount = allEvidence.filter((e: any) => e.storageUrl !== null).length;
    const physicalCount = allEvidence.filter((e: any) => e.storageUrl === null).length;
    const totalFileSize = allEvidence.reduce(
      (sum: number, e: any) => sum + (e.fileSize || 0),
      0
    );

    // Stale evidence (1 year old, not in court/destroyed/returned)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const staleCount = allEvidence.filter(
      (e: any) =>
        new Date(e.collectedDate) < oneYearAgo &&
        !["court", "destroyed", "returned"].includes(e.status)
    ).length;

    // Critical evidence
    const criticalCount = allEvidence.filter(
      (e: any) =>
        e.type === "biological" ||
        (e.tags as string[]).some((t: string) =>
          ["critical", "high-value", "weapon"].includes(t)
        )
    ).length;

    return {
      total,
      byType: {
        physical,
        document,
        photo,
        video,
        audio,
        digital,
        biological,
        other,
      },
      byStatus: {
        collected,
        stored,
        analyzed,
        court,
        returned,
        destroyed,
      },
      sealed,
      digital: digitalCount,
      physical: physicalCount,
      stale: staleCount,
      critical: criticalCount,
      totalFileSize,
    };
  }

  /**
   * Check if QR code already exists
   */
  async existsByQRCode(qrCode: string): Promise<boolean> {
    const count = await this.prisma.evidence.count({
      where: { qrCode },
    });
    return count > 0;
  }

  /**
   * Generate unique QR code
   */
  async generateQRCode(stationCode: string): Promise<string> {
    const year = new Date().getFullYear();

    // Count evidence for this station this year
    const count = await this.prisma.evidence.count({
      where: {
        stationId: stationCode,
        collectedDate: {
          gte: new Date(`${year}-01-01`),
        },
      } as any,
    });

    const sequentialNumber = String(count + 1).padStart(6, "0");
    const qrCode = `${stationCode}-EV-${year}-${sequentialNumber}`;

    // Ensure uniqueness
    const exists = await this.existsByQRCode(qrCode);
    if (exists) {
      // If exists, try with timestamp
      const timestamp = Date.now().toString().slice(-4);
      return `${qrCode}-${timestamp}`;
    }

    return qrCode;
  }

  /**
   * Get evidence by file hash
   */
  async findByFileHash(fileHash: string): Promise<Evidence[]> {
    const data = await this.prisma.evidence.findMany({
      where: { fileHash },
    });

    return data.map((d) => this.toDomain(d));
  }

  /**
   * Get recently added evidence
   */
  async getRecentlyAdded(stationId?: string, limit = 20): Promise<Evidence[]> {
    const where: any = stationId ? { stationId } : {};

    const data = await this.prisma.evidence.findMany({
      where,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    return data.map((d) => this.toDomain(d));
  }

  /**
   * Get evidence by storage location
   */
  async findByStorageLocation(location: string): Promise<Evidence[]> {
    const data = await this.prisma.evidence.findMany({
      where: {
        storageLocation: {
          contains: location,
          mode: "insensitive",
        },
      } as any,
      orderBy: {
        collectedDate: "desc",
      },
    });

    return data.map((d) => this.toDomain(d));
  }
}

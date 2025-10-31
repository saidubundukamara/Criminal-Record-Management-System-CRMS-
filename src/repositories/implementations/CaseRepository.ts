/**
 * Case Repository Implementation
 *
 * Handles all database operations for criminal cases.
 * Maps Prisma models to Case domain entities.
 *
 * Pan-African Design: Supports any country's case numbering format and workflows
 */
import { PrismaClient, Case as PrismaCase } from "@prisma/client";
import {
  ICaseRepository,
  CreateCaseDto,
  UpdateCaseDto,
  CaseFilters,
  CaseWithRelations,
} from "@/src/domain/interfaces/repositories/ICaseRepository";
import { Case, CaseStatus, CaseSeverity } from "@/src/domain/entities/Case";
import { BaseRepository } from "../base/BaseRepository";

export class CaseRepository extends BaseRepository implements ICaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findById(
    id: string,
    includeRelations = false
  ): Promise<CaseWithRelations | null> {
    return this.execute(async () => {
      const caseData = await this.prisma.case.findUnique({
        where: { id },
        include: includeRelations
          ? {
              officer: {
                select: { id: true, name: true, badge: true },
              },
              station: {
                select: { id: true, name: true, code: true },
              },
              _count: {
                select: {
                  persons: true,
                  evidence: true,
                  notes: true,
                },
              },
            }
          : undefined,
      });

      if (!caseData) return null;

      const domainCase = this.toDomain(caseData);

      // Add relations if requested
      if (includeRelations && "officer" in caseData && "station" in caseData && "_count" in caseData) {
        return {
          ...domainCase,
          officer: caseData.officer,
          station: caseData.station,
          personsCount: (caseData._count as any).persons,
          evidenceCount: (caseData._count as any).evidence,
          notesCount: (caseData._count as any).notes,
        } as CaseWithRelations;
      }

      return domainCase as CaseWithRelations;
    }, "findById");
  }

  async findByCaseNumber(caseNumber: string): Promise<Case | null> {
    return this.execute(async () => {
      const caseData = await this.prisma.case.findUnique({
        where: { caseNumber },
      });

      return caseData ? this.toDomain(caseData) : null;
    }, "findByCaseNumber");
  }

  async findAll(filters?: CaseFilters): Promise<CaseWithRelations[]> {
    return this.execute(async () => {
      const where = this.buildWhereClause(filters);
      const limit = filters?.limit ?? 50;
      const offset = filters?.offset ?? 0;

      const cases = await this.prisma.case.findMany({
        where,
        include: {
          officer: {
            select: { id: true, name: true, badge: true },
          },
          station: {
            select: { id: true, name: true, code: true },
          },
          _count: {
            select: {
              persons: true,
              evidence: true,
              notes: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      });

      return cases.map((c) => ({
        ...this.toDomain(c),
        officer: c.officer,
        station: c.station,
        personsCount: c._count.persons,
        evidenceCount: c._count.evidence,
        notesCount: c._count.notes,
      })) as CaseWithRelations[];
    }, "findAll");
  }

  async findByStationId(
    stationId: string,
    filters?: CaseFilters
  ): Promise<Case[]> {
    return this.execute(async () => {
      const where = this.buildWhereClause({ ...filters, stationId });

      const cases = await this.prisma.case.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });

      return cases.map((c) => this.toDomain(c));
    }, "findByStationId");
  }

  async findByOfficerId(
    officerId: string,
    filters?: CaseFilters
  ): Promise<Case[]> {
    return this.execute(async () => {
      const where = this.buildWhereClause({ ...filters, officerId });

      const cases = await this.prisma.case.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });

      return cases.map((c) => this.toDomain(c));
    }, "findByOfficerId");
  }

  async findByPersonId(personId: string): Promise<Case[]> {
    return this.execute(async () => {
      const cases = await this.prisma.case.findMany({
        where: {
          persons: {
            some: {
              personId: personId,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return cases.map((c) => this.toDomain(c));
    }, "findByPersonId");
  }

  async count(filters?: CaseFilters): Promise<number> {
    return this.execute(async () => {
      const where = this.buildWhereClause(filters);
      return await this.prisma.case.count({ where });
    }, "count");
  }

  async create(data: CreateCaseDto): Promise<Case> {
    return this.execute(async () => {
      // Generate case number
      const caseNumber = await this.generateCaseNumber(data.stationId);

      const caseData = await this.prisma.case.create({
        data: {
          caseNumber,
          title: data.title,
          description: data.description,
          category: data.category,
          severity: data.severity,
          status: "open",
          incidentDate: data.incidentDate,
          reportedDate: new Date(),
          location: data.location,
          stationId: data.stationId,
          officerId: data.officerId,
        },
      });

      return this.toDomain(caseData);
    }, "create");
  }

  async update(id: string, data: UpdateCaseDto): Promise<Case> {
    return this.execute(async () => {
      const caseData = await this.prisma.case.update({
        where: { id },
        data,
      });

      return this.toDomain(caseData);
    }, "update");
  }

  async updateStatus(id: string, status: CaseStatus): Promise<Case> {
    return this.execute(async () => {
      const caseData = await this.prisma.case.update({
        where: { id },
        data: { status },
      });

      return this.toDomain(caseData);
    }, "updateStatus");
  }

  async delete(id: string): Promise<void> {
    return this.execute(async () => {
      await this.prisma.case.delete({ where: { id } });
    }, "delete");
  }

  /**
   * Generate unique case number
   * Format: {StationCode}-{Year}-{SequentialNumber}
   * Example: HQ-001-2025-000001 (Sierra Leone)
   * Example: GPS-2025-000123 (Ghana)
   * Configurable per country's format
   */
  async generateCaseNumber(stationId: string): Promise<string> {
    return this.execute(async () => {
      // Get station code
      const station = await this.prisma.station.findUnique({
        where: { id: stationId },
        select: { code: true },
      });

      if (!station) {
        throw new Error("Station not found");
      }

      // Get current year
      const year = new Date().getFullYear();

      // Count cases for this station in current year
      const caseCount = await this.prisma.case.count({
        where: {
          stationId,
          createdAt: {
            gte: new Date(`${year}-01-01`),
          },
        },
      });

      // Sequential number (padded to 6 digits)
      const sequentialNumber = String(caseCount + 1).padStart(6, "0");

      // Format: {StationCode}-{Year}-{SequentialNumber}
      return `${station.code}-${year}-${sequentialNumber}`;
    }, "generateCaseNumber");
  }

  async assignOfficer(caseId: string, officerId: string): Promise<Case> {
    return this.execute(async () => {
      const caseData = await this.prisma.case.update({
        where: { id: caseId },
        data: { officerId },
      });

      return this.toDomain(caseData);
    }, "assignOfficer");
  }

  async getCountByStatus(stationId?: string): Promise<Record<CaseStatus, number>> {
    return this.execute(async () => {
      const where = stationId ? { stationId } : {};

      const results = await this.prisma.case.groupBy({
        by: ["status"],
        where,
        _count: { status: true },
      });

      const statusCounts: Record<string, number> = {
        open: 0,
        investigating: 0,
        charged: 0,
        court: 0,
        closed: 0,
      };

      results.forEach((result) => {
        statusCounts[result.status] = result._count.status;
      });

      return statusCounts as Record<CaseStatus, number>;
    }, "getCountByStatus");
  }

  async getCountBySeverity(
    stationId?: string
  ): Promise<Record<CaseSeverity, number>> {
    return this.execute(async () => {
      const where = stationId ? { stationId } : {};

      const results = await this.prisma.case.groupBy({
        by: ["severity"],
        where,
        _count: { severity: true },
      });

      const severityCounts: Record<string, number> = {
        minor: 0,
        major: 0,
        critical: 0,
      };

      results.forEach((result) => {
        severityCounts[result.severity] = result._count.severity;
      });

      return severityCounts as Record<CaseSeverity, number>;
    }, "getCountBySeverity");
  }

  async getStaleCases(stationId?: string, days = 30): Promise<Case[]> {
    return this.execute(async () => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const where: any = {
        status: { not: "closed" },
        updatedAt: { lt: cutoffDate },
      };

      if (stationId) {
        where.stationId = stationId;
      }

      const cases = await this.prisma.case.findMany({
        where,
        orderBy: { updatedAt: "asc" },
      });

      return cases.map((c) => this.toDomain(c));
    }, "getStaleCases");
  }

  /**
   * Build WHERE clause from filters
   */
  private buildWhereClause(filters?: CaseFilters): any {
    if (!filters) return {};

    const where: any = {};

    // Status filter (single or array)
    if (filters.status) {
      where.status = Array.isArray(filters.status)
        ? { in: filters.status }
        : filters.status;
    }

    // Category filter (single or array)
    if (filters.category) {
      where.category = Array.isArray(filters.category)
        ? { in: filters.category }
        : filters.category;
    }

    // Severity filter (single or array)
    if (filters.severity) {
      where.severity = Array.isArray(filters.severity)
        ? { in: filters.severity }
        : filters.severity;
    }

    // Station filter
    if (filters.stationId) {
      where.stationId = filters.stationId;
    }

    // Officer filter
    if (filters.officerId) {
      where.officerId = filters.officerId;
    }

    // Date range filter (incident date)
    if (filters.startDate || filters.endDate) {
      where.incidentDate = {};
      if (filters.startDate) {
        where.incidentDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.incidentDate.lte = filters.endDate;
      }
    }

    // Search filter (case number, title)
    if (filters.search) {
      where.OR = [
        { caseNumber: { contains: filters.search, mode: "insensitive" } },
        { title: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return where;
  }

  /**
   * Map Prisma model to Domain entity
   * This ensures the repository layer returns domain entities, not Prisma models
   */
  private toDomain(data: PrismaCase): Case {
    return new Case(
      data.id,
      data.caseNumber,
      data.title,
      data.description,
      data.category,
      data.severity as CaseSeverity,
      data.status as CaseStatus,
      data.incidentDate,
      data.reportedDate,
      data.location,
      data.stationId,
      data.officerId,
      data.createdAt,
      data.updatedAt
    );
  }
}

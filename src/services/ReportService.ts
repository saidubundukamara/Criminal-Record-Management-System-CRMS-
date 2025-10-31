/**
 * Report Service
 *
 * Business logic layer for PDF and CSV report generation
 * Handles:
 * - Case report generation (individual case summaries)
 * - Station performance reports (monthly/quarterly)
 * - Compliance reports (data protection authority)
 * - Custom filtered reports
 * - Report scheduling (future feature)
 *
 * Pan-African Design:
 * - Country-agnostic report templates
 * - Multi-language support ready
 * - Configurable date formats per country
 * - Low-bandwidth PDF optimization
 */

import { ICaseRepository } from "@/src/domain/interfaces/repositories/ICaseRepository";
import { IPersonRepository } from "@/src/domain/interfaces/repositories/IPersonRepository";
import { IEvidenceRepository } from "@/src/domain/interfaces/repositories/IEvidenceRepository";
import { IAuditLogRepository } from "@/src/domain/interfaces/repositories/IAuditLogRepository";
import { NotFoundError, ValidationError, ForbiddenError } from "@/src/lib/errors";
import { Case } from "@/src/domain/entities/Case";
import { Evidence } from "@/src/domain/entities/Evidence";

/**
 * Case report data structure
 */
export interface CaseReportData {
  case: Case;
  persons: {
    id: string;
    nin: string;
    firstName: string;
    lastName: string;
    role: string; // suspect, victim, witness, informant
  }[];
  evidence: Evidence[];
  auditTrail: {
    timestamp: Date;
    action: string;
    officerBadge: string;
    details: string;
  }[];
  chainOfCustody: {
    evidenceId: string;
    evidenceDescription: string;
    events: {
      timestamp: Date;
      officerId: string;
      action: string;
      location: string;
    }[];
  }[];
}

/**
 * Station report data structure
 */
export interface StationReportData {
  station: {
    id: string;
    code: string;
    name: string;
  };
  period: {
    startDate: Date;
    endDate: Date;
    label: string; // "January 2025", "Q1 2025", etc.
  };
  metrics: {
    totalCases: number;
    casesOpened: number;
    casesClosed: number;
    resolutionRate: number;
    averageResolutionDays: number;
    staleCases: number;
    evidenceCollected: number;
    backgroundChecks: number;
    activeAlerts: number;
  };
  casesByCategory: { category: string; count: number }[];
  casesBySeverity: { severity: string; count: number }[];
  topOfficers: {
    badge: string;
    name: string;
    casesClosed: number;
  }[];
}

/**
 * Compliance report data structure
 */
export interface ComplianceReportData {
  reportType: "gdpr" | "malabo" | "audit";
  period: {
    startDate: Date;
    endDate: Date;
  };
  dataProtection: {
    totalRecords: number;
    encryptedFields: number;
    accessLogs: number;
    dataBreaches: number;
    retentionCompliance: number;
  };
  auditMetrics: {
    totalActions: number;
    failedActions: number;
    suspiciousActivity: number;
    unauthorizedAttempts: number;
  };
  userActivity: {
    totalOfficers: number;
    activeOfficers: number;
    inactiveOfficers: number;
    recentLogins: number;
  };
  systemHealth: {
    uptime: number;
    syncErrors: number;
    dataIntegrity: number;
  };
}

export class ReportService {
  constructor(
    private readonly caseRepo: ICaseRepository,
    private readonly personRepo: IPersonRepository,
    private readonly evidenceRepo: IEvidenceRepository,
    private readonly auditRepo: IAuditLogRepository
  ) {}

  /**
   * Generate comprehensive case report
   * Includes case details, persons, evidence, and full audit trail
   */
  async generateCaseReport(caseId: string, officerId: string): Promise<CaseReportData> {
    // Fetch case
    const caseEntity = await this.caseRepo.findById(caseId);
    if (!caseEntity) {
      throw new NotFoundError(`Case ${caseId} not found`);
    }

    // Fetch related persons (via CasePerson junction)
    // Note: This is simplified - in production, fetch via CasePersonRepository
    const persons = await this.personRepo.findAll({});
    const casePersons = persons
      .slice(0, 5) // Placeholder - would filter by caseId
      .map((p) => ({
        id: p.id,
        nin: p.nin || "", // Handle nullable NIN
        firstName: p.firstName,
        lastName: p.lastName,
        role: "suspect" as const, // Placeholder - would come from CasePerson
      }));

    // Fetch evidence
    const evidenceResult = await this.evidenceRepo.findAll({
      caseId,
    });

    // Fetch audit trail for this case
    const auditLogs = await this.auditRepo.findAll({
      entityType: "case",
      entityId: caseId,
    });

    const auditTrail = auditLogs.map((log) => ({
      timestamp: log.createdAt,
      action: log.action,
      officerBadge: log.officerId || "SYSTEM", // Placeholder - would join with Officer
      details: JSON.stringify(log.details),
    }));

    // Build chain of custody for each evidence item
    const chainOfCustody = await Promise.all(
      evidenceResult.map(async (evidence) => {
        const evidenceAudit = await this.auditRepo.findAll({
          entityType: "evidence",
          entityId: evidence.id,
        });

        return {
          evidenceId: evidence.id,
          evidenceDescription: evidence.description,
          events: evidenceAudit.map((log) => ({
            timestamp: log.createdAt,
            officerId: log.officerId || "SYSTEM",
            action: log.action,
            location: log.stationId || "Unknown",
          })),
        };
      })
    );

    // Audit log report generation
    await this.auditRepo.create({
      entityType: "report",
      entityId: caseId,
      action: "generate",
      officerId,
      stationId: caseEntity.stationId,
      success: true,
      details: {
        reportType: "case",
        caseNumber: caseEntity.caseNumber,
      },
      ipAddress: "system",
    });

    return {
      case: caseEntity,
      persons: casePersons,
      evidence: evidenceResult,
      auditTrail,
      chainOfCustody,
    };
  }

  /**
   * Generate station performance report
   * Monthly or quarterly performance summary
   */
  async generateStationReport(
    stationId: string,
    startDate: Date,
    endDate: Date,
    officerId: string
  ): Promise<StationReportData> {
    // Validate date range
    if (startDate >= endDate) {
      throw new ValidationError("Start date must be before end date");
    }

    // Fetch station cases within period
    const cases = await this.caseRepo.findAll({
      stationId,
      startDate: startDate,
      endDate: endDate,
    });

    const totalCases = cases.length;
    const casesOpened = cases.filter((c) => c.createdAt >= startDate).length;
    const casesClosed = cases.filter(
      (c) => c.status === "closed" && c.updatedAt <= endDate
    ).length;

    const resolutionRate = totalCases > 0 ? (casesClosed / totalCases) * 100 : 0;

    // Calculate average resolution time (using updatedAt as proxy for closure time)
    const closedCases = cases.filter((c) => c.status === "closed");
    const averageResolutionDays =
      closedCases.length > 0
        ? closedCases.reduce((sum, c) => {
            const days = (c.updatedAt.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24);
            return sum + days;
          }, 0) / closedCases.length
        : 0;

    // Stale cases (30+ days no activity)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const staleCases = cases.filter(
      (c) => c.status !== "closed" && c.updatedAt < thirtyDaysAgo
    ).length;

    // Fetch evidence collected
    const evidence = await this.evidenceRepo.findAll({
      stationId,
      collectedAfter: startDate,
      collectedBefore: endDate,
    });

    // Group by category and severity
    const casesByCategory = this.groupByField(cases, (c) => c.category);
    const casesBySeverityRaw = this.groupByField(cases, (c) => c.severity);
    const casesBySeverity = casesBySeverityRaw.map(item => ({ severity: item.category, count: item.count }));

    // Top officers (placeholder - needs OfficerRepository)
    const topOfficers = [
      { badge: "SA-00001", name: "Officer One", casesClosed: 15 },
      { badge: "SA-00002", name: "Officer Two", casesClosed: 12 },
      { badge: "SA-00003", name: "Officer Three", casesClosed: 10 },
    ];

    // Determine period label
    const periodLabel = this.formatPeriodLabel(startDate, endDate);

    // Audit log
    await this.auditRepo.create({
      entityType: "report",
      entityId: stationId,
      action: "generate",
      officerId,
      stationId,
      success: true,
      details: {
        reportType: "station",
        period: { startDate, endDate },
      },
      ipAddress: "system",
    });

    return {
      station: {
        id: stationId,
        code: "HQ", // Placeholder
        name: "Headquarters", // Placeholder
      },
      period: {
        startDate,
        endDate,
        label: periodLabel,
      },
      metrics: {
        totalCases,
        casesOpened,
        casesClosed,
        resolutionRate: Math.round(resolutionRate * 10) / 10,
        averageResolutionDays: Math.round(averageResolutionDays * 10) / 10,
        staleCases,
        evidenceCollected: evidence.length,
        backgroundChecks: 0, // Placeholder
        activeAlerts: 0, // Placeholder
      },
      casesByCategory,
      casesBySeverity,
      topOfficers,
    };
  }

  /**
   * Generate compliance report
   * For data protection authorities (GDPR, Malabo Convention)
   */
  async generateComplianceReport(
    reportType: "gdpr" | "malabo" | "audit",
    startDate: Date,
    endDate: Date,
    officerId: string
  ): Promise<ComplianceReportData> {
    // Validate dates
    if (startDate >= endDate) {
      throw new ValidationError("Start date must be before end date");
    }

    // Fetch all audit logs for the period
    const auditLogs = await this.auditRepo.findAll({
      fromDate: startDate,
      toDate: endDate,
    });

    const totalActions = auditLogs.length;
    const failedActions = auditLogs.filter((log) => !log.success).length;

    // Detect suspicious activity (multiple failed attempts, unusual patterns)
    const suspiciousActivity = auditLogs.filter(
      (log) => !log.success && log.action === "login"
    ).length;

    const unauthorizedAttempts = auditLogs.filter(
      (log) => !log.success && log.action === "read"
    ).length;

    // Data protection metrics (placeholder - would query encrypted fields)
    const persons = await this.personRepo.findAll({});
    const totalRecords = persons.length;
    const encryptedFields = persons.length * 3; // Placeholder (address, phone, email)

    // Audit log for compliance report generation
    await this.auditRepo.create({
      entityType: "report",
      entityId: "compliance",
      action: "generate",
      officerId,
      stationId: "system",
      success: true,
      details: {
        reportType,
        period: { startDate, endDate },
      },
      ipAddress: "system",
    });

    return {
      reportType,
      period: {
        startDate,
        endDate,
      },
      dataProtection: {
        totalRecords,
        encryptedFields,
        accessLogs: totalActions,
        dataBreaches: 0, // Placeholder
        retentionCompliance: 100, // Placeholder (percentage)
      },
      auditMetrics: {
        totalActions,
        failedActions,
        suspiciousActivity,
        unauthorizedAttempts,
      },
      userActivity: {
        totalOfficers: 200, // Placeholder
        activeOfficers: 180, // Placeholder
        inactiveOfficers: 20, // Placeholder
        recentLogins: 150, // Placeholder
      },
      systemHealth: {
        uptime: 99.9, // Placeholder (percentage)
        syncErrors: 5, // Placeholder
        dataIntegrity: 100, // Placeholder (percentage)
      },
    };
  }

  // ========================
  // PRIVATE HELPER METHODS
  // ========================

  private groupByField<T>(
    items: T[],
    fieldGetter: (item: T) => string
  ): { category: string; count: number }[] {
    const grouped = items.reduce(
      (acc, item) => {
        const key = fieldGetter(item);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(grouped)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }

  private formatPeriodLabel(startDate: Date, endDate: Date): string {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const sameMonth =
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getFullYear() === endDate.getFullYear();

    if (sameMonth) {
      return `${months[startDate.getMonth()]} ${startDate.getFullYear()}`;
    }

    // Check if quarterly
    const quarter = Math.floor(startDate.getMonth() / 3) + 1;
    return `Q${quarter} ${startDate.getFullYear()}`;
  }
}

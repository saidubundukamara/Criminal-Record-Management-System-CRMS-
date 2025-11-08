/**
 * Analytics Service
 *
 * Business logic layer for dashboard analytics and reporting metrics
 * Aggregates data from multiple repositories to provide insights on:
 * - Officer productivity (cases, response times, activity)
 * - Case trends (time-series analysis, resolution rates, aging)
 * - Station performance (comparative metrics, resource utilization)
 * - National statistics (crime patterns, geographic distribution)
 *
 * Pan-African Design:
 * - Country-agnostic metrics calculations
 * - Configurable time periods and aggregations
 * - Multi-language support for chart labels
 * - Low-bandwidth optimization (minimal data payloads)
 */

import { ICaseRepository } from "@/src/domain/interfaces/repositories/ICaseRepository";
import { IPersonRepository } from "@/src/domain/interfaces/repositories/IPersonRepository";
import { IEvidenceRepository } from "@/src/domain/interfaces/repositories/IEvidenceRepository";
import { IAuditLogRepository } from "@/src/domain/interfaces/repositories/IAuditLogRepository";
import { IBackgroundCheckRepository } from "@/src/domain/interfaces/repositories/IBackgroundCheckRepository";
import { IAmberAlertRepository } from "@/src/domain/interfaces/repositories/IAmberAlertRepository";
import { IVehicleRepository } from "@/src/domain/interfaces/repositories/IVehicleRepository";
import { ValidationError } from "@/src/lib/errors";

/**
 * Date range filter for analytics queries
 */
export interface DateRangeFilter {
  startDate: Date;
  endDate: Date;
}

/**
 * Officer productivity metrics
 */
export interface OfficerProductivityMetrics {
  officerId: string;
  officerBadge: string;
  officerName: string;
  stationId: string;
  stationName: string;
  metrics: {
    totalCases: number;
    activeCases: number;
    closedCases: number;
    casesThisWeek: number;
    casesThisMonth: number;
    evidenceCollected: number;
    backgroundChecksPerformed: number;
    ussdQueriesThisWeek: number;
    averageResolutionDays: number;
    casesByCategory: { category: string; count: number }[];
    activityTimeline: { date: string; count: number }[];
  };
  rankings: {
    stationRank: number;
    totalOfficersInStation: number;
  };
}

/**
 * Case trend data point
 */
export interface CaseTrendDataPoint {
  date: string; // ISO date string (YYYY-MM-DD)
  open: number;
  investigating: number;
  charged: number;
  court: number;
  closed: number;
  total: number;
}

/**
 * Case trends analytics
 */
export interface CaseTrendsMetrics {
  dateRange: DateRangeFilter;
  timeline: CaseTrendDataPoint[];
  categoryBreakdown: { category: string; count: number; percentageChange: number }[];
  severityBreakdown: { severity: string; count: number; percentageChange: number }[];
  resolutionMetrics: {
    averageResolutionDays: number;
    resolutionRate: number; // Percentage of cases closed
    medianResolutionDays: number;
    staleCases: number; // 30+ days no activity
  };
  topStations: { stationId: string; stationName: string; caseCount: number }[];
}

/**
 * Station performance metrics
 */
export interface StationPerformanceMetrics {
  stationId: string;
  stationCode: string;
  stationName: string;
  metrics: {
    totalCases: number;
    activeCases: number;
    closedCases: number;
    resolutionRate: number;
    averageResolutionDays: number;
    totalOfficers: number;
    activeOfficers: number;
    casesPerOfficer: number;
    evidenceItems: number;
    personRecords: number;
    vehicleRecords: number;
    backgroundChecks: number;
    activeAlerts: number;
  };
  trends: {
    casesThisWeek: number;
    casesLastWeek: number;
    weekOverWeekChange: number;
    casesThisMonth: number;
    casesLastMonth: number;
    monthOverMonthChange: number;
  };
  casesByCategory: { category: string; count: number }[];
}

/**
 * National crime statistics
 */
export interface NationalStatistics {
  overview: {
    totalCases: number;
    totalPersons: number;
    totalEvidence: number;
    totalOfficers: number;
    totalStations: number;
    wantedPersons: number;
    missingPersons: number;
    stolenVehicles: number;
  };
  caseMetrics: {
    byStatus: { status: string; count: number; percentage: number }[];
    byCategory: { category: string; count: number; percentage: number }[];
    bySeverity: { severity: string; count: number; percentage: number }[];
  };
  geographicDistribution: {
    stationId: string;
    stationCode: string;
    stationName: string;
    caseCount: number;
    percentage: number;
  }[];
  trends: {
    last7Days: { date: string; count: number }[];
    last30Days: { date: string; count: number }[];
    last12Months: { month: string; count: number }[];
  };
  topOfficers: {
    officerId: string;
    officerBadge: string;
    officerName: string;
    casesClosed: number;
  }[];
}

export class AnalyticsService {
  constructor(
    private readonly caseRepo: ICaseRepository,
    private readonly personRepo: IPersonRepository,
    private readonly evidenceRepo: IEvidenceRepository,
    private readonly auditRepo: IAuditLogRepository,
    private readonly bgCheckRepo: IBackgroundCheckRepository,
    private readonly alertRepo: IAmberAlertRepository,
    private readonly vehicleRepo: IVehicleRepository
  ) {}

  /**
   * Get officer productivity metrics
   * Scope: Own (single officer) or Station (all officers in station)
   */
  async getOfficerProductivityMetrics(
    officerId: string,
    dateRange?: DateRangeFilter
  ): Promise<OfficerProductivityMetrics> {
    // Validate date range
    if (dateRange) {
      this.validateDateRange(dateRange);
    }

    // Get officer details from audit logs (officer info stored there)
    const officerCases = await this.caseRepo.findAll({
      officerId: officerId,
      ...(dateRange && {
        createdAfter: dateRange.startDate,
        createdBefore: dateRange.endDate,
      }),
    });

    const totalCases = officerCases.length;
    const activeCases = officerCases.filter((c) => c.status !== "closed").length;
    const closedCases = officerCases.filter((c) => c.status === "closed").length;

    // Calculate time-based metrics
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const casesThisWeek = officerCases.filter(
      (c) => c.createdAt >= oneWeekAgo
    ).length;
    const casesThisMonth = officerCases.filter(
      (c) => c.createdAt >= oneMonthAgo
    ).length;

    // Get evidence collected by this officer
    const evidenceCollected = await this.evidenceRepo.findAll({
      collectedBy: officerId,
      ...(dateRange && {
        createdAfter: dateRange.startDate,
        createdBefore: dateRange.endDate,
      }),
    });

    // Get background checks performed
    const backgroundChecks = await this.bgCheckRepo.findAll({
      requestedById: officerId,
      ...(dateRange && {
        createdAfter: dateRange.startDate,
        createdBefore: dateRange.endDate,
      }),
    });

    // Calculate average resolution time (for closed cases)
    // Using updatedAt as proxy for closure time since closedAt doesn't exist
    const closedCasesList = officerCases.filter((c) => c.status === "closed");
    const averageResolutionDays = closedCasesList.length > 0
      ? closedCasesList.reduce((sum, c) => {
          const resolutionTime = c.updatedAt.getTime() - c.createdAt.getTime();
          return sum + resolutionTime / (1000 * 60 * 60 * 24); // Convert to days
        }, 0) / closedCasesList.length
      : 0;

    // Group cases by category
    const casesByCategory = this.groupByField(
      officerCases,
      (c) => c.category
    );

    // Generate activity timeline (cases per day/week)
    const activityTimeline = this.generateActivityTimeline(
      officerCases,
      dateRange
    );

    // Get officer info from first case or audit log
    // In production, you'd fetch from OfficerRepository
    const firstCase = officerCases[0];
    const officerBadge = firstCase?.officerId || officerId;
    const officerName = "Officer Name"; // Placeholder - fetch from OfficerRepo
    const stationId = firstCase?.stationId || "unknown";
    const stationName = "Station Name"; // Placeholder - fetch from StationRepo

    // Calculate station rank (placeholder - needs OfficerRepository)
    const stationRank = 1;
    const totalOfficersInStation = 10;

    return {
      officerId,
      officerBadge,
      officerName,
      stationId,
      stationName,
      metrics: {
        totalCases,
        activeCases,
        closedCases,
        casesThisWeek,
        casesThisMonth,
        evidenceCollected: evidenceCollected.length,
        backgroundChecksPerformed: backgroundChecks.length,
        ussdQueriesThisWeek: 0, // Would query USSDQueryLog
        averageResolutionDays: Math.round(averageResolutionDays * 10) / 10,
        casesByCategory,
        activityTimeline,
      },
      rankings: {
        stationRank,
        totalOfficersInStation,
      },
    };
  }

  /**
   * Get case trends over time
   * Scope: Station, Region, or National
   */
  async getCaseTrendsMetrics(
    filters: {
      stationId?: string;
      dateRange: DateRangeFilter;
    }
  ): Promise<CaseTrendsMetrics> {
    this.validateDateRange(filters.dateRange);

    // Fetch all cases within date range
    const cases = await this.caseRepo.findAll({
      ...(filters.stationId && { stationId: filters.stationId }),
      startDate: filters.dateRange.startDate,
      endDate: filters.dateRange.endDate,
    });

    // Generate timeline (group by date)
    const timeline = this.generateCaseTrendTimeline(
      cases,
      filters.dateRange
    );

    // Category breakdown with percentage change
    const categoryBreakdown = this.calculateCategoryBreakdown(
      cases,
      filters.dateRange
    );

    // Severity breakdown with percentage change
    const severityBreakdown = this.calculateSeverityBreakdown(
      cases,
      filters.dateRange
    );

    // Resolution metrics
    const resolutionMetrics = this.calculateResolutionMetrics(cases);

    // Top stations
    const topStations = await this.getTopStationsByCase(filters.dateRange);

    return {
      dateRange: filters.dateRange,
      timeline,
      categoryBreakdown,
      severityBreakdown,
      resolutionMetrics,
      topStations,
    };
  }

  /**
   * Get station performance metrics
   * Scope: Single station or all stations (for comparison)
   */
  async getStationPerformanceMetrics(
    stationId: string
  ): Promise<StationPerformanceMetrics> {
    // Fetch station cases
    const allCases = await this.caseRepo.findAll({ stationId });
    const totalCases = allCases.length;
    const activeCases = allCases.filter((c) => c.status !== "closed").length;
    const closedCases = allCases.filter((c) => c.status === "closed").length;

    // Resolution metrics
    const resolutionRate = totalCases > 0 ? (closedCases / totalCases) * 100 : 0;
    const averageResolutionDays = this.calculateAverageResolutionDays(
      allCases.filter((c) => c.status === "closed")
    );

    // Time-based trends
    const now = new Date();
    const thisWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const thisMonthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const lastMonthStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const casesThisWeek = allCases.filter(
      (c) => c.createdAt >= thisWeekStart
    ).length;
    const casesLastWeek = allCases.filter(
      (c) => c.createdAt >= lastWeekStart && c.createdAt < thisWeekStart
    ).length;
    const weekOverWeekChange = this.calculatePercentageChange(
      casesLastWeek,
      casesThisWeek
    );

    const casesThisMonth = allCases.filter(
      (c) => c.createdAt >= thisMonthStart
    ).length;
    const casesLastMonth = allCases.filter(
      (c) => c.createdAt >= lastMonthStart && c.createdAt < thisMonthStart
    ).length;
    const monthOverMonthChange = this.calculatePercentageChange(
      casesLastMonth,
      casesThisMonth
    );

    // Get other station resources
    const evidenceItems = await this.evidenceRepo.findAll({ stationId });
    const personRecords = await this.personRepo.findAll({}); // Filter by station if available
    // Phase 7 - Vehicle repo not yet implemented
    // const vehicleRecordsResult = await this.vehicleRepo.search({ stationId }, { limit: 10000 });
    const vehicleRecords: any[] = []; // Placeholder until Phase 7
    const backgroundChecks = await this.bgCheckRepo.findAll({}); // Filter by station if available
    const activeAlerts = await this.alertRepo.findActive();

    // Cases by category
    const casesByCategory = this.groupByField(allCases, (c) => c.category);

    // Placeholder values (would fetch from OfficerRepository)
    const totalOfficers = 50;
    const activeOfficers = 45;
    const casesPerOfficer = activeOfficers > 0 ? totalCases / activeOfficers : 0;

    return {
      stationId,
      stationCode: "HQ", // Placeholder - fetch from Station model
      stationName: "Headquarters", // Placeholder - fetch from Station model
      metrics: {
        totalCases,
        activeCases,
        closedCases,
        resolutionRate: Math.round(resolutionRate * 10) / 10,
        averageResolutionDays: Math.round(averageResolutionDays * 10) / 10,
        totalOfficers,
        activeOfficers,
        casesPerOfficer: Math.round(casesPerOfficer * 10) / 10,
        evidenceItems: evidenceItems.length,
        personRecords: personRecords.length,
        vehicleRecords: vehicleRecords.length,
        backgroundChecks: backgroundChecks.length,
        activeAlerts: activeAlerts.length,
      },
      trends: {
        casesThisWeek,
        casesLastWeek,
        weekOverWeekChange,
        casesThisMonth,
        casesLastMonth,
        monthOverMonthChange,
      },
      casesByCategory,
    };
  }

  /**
   * Get national crime statistics
   * Scope: National only (SuperAdmin/Admin)
   */
  async getNationalStatistics(): Promise<NationalStatistics> {
    // Get overview counts
    const allCases = await this.caseRepo.findAll({});
    const allPersons = await this.personRepo.findAll({});
    const allEvidence = await this.evidenceRepo.findAll({});
    // Phase 7 - Vehicle repo not yet implemented
    // const allVehiclesResult = await this.vehicleRepo.search({}, { limit: 10000 });
    const allVehicles: any[] = []; // Placeholder until Phase 7

    const wantedPersons = allPersons.filter((p) => p.isWanted).length;
    const activeAlerts = await this.alertRepo.findActive();
    const missingPersons = activeAlerts.length; // All amber alerts are missing persons
    const stolenVehicles = allVehicles.filter((v) => v.status === "stolen").length;

    // Case metrics by status, category, severity
    const totalCaseCount = allCases.length;
    const byStatusRaw = this.groupByFieldWithPercentage(
      allCases,
      (c) => c.status,
      totalCaseCount
    );
    const byCategoryRaw = this.groupByFieldWithPercentage(
      allCases,
      (c) => c.category,
      totalCaseCount
    );
    const bySeverityRaw = this.groupByFieldWithPercentage(
      allCases,
      (c) => c.severity,
      totalCaseCount
    );

    // Map to correct key names
    const byStatus = byStatusRaw; // Already has status key
    const byCategory = byCategoryRaw.map(item => ({ category: item.status, count: item.count, percentage: item.percentage }));
    const bySeverity = bySeverityRaw.map(item => ({ severity: item.status, count: item.count, percentage: item.percentage }));

    // Geographic distribution (by station)
    const geographicDistribution = this.calculateGeographicDistribution(
      allCases,
      totalCaseCount
    );

    // Trends
    const last7Days = this.generateTrendData(allCases, 7);
    const last30Days = this.generateTrendData(allCases, 30);
    const last12Months = this.generateMonthlyTrendData(allCases, 12);

    // Top officers (placeholder - needs OfficerRepository)
    const topOfficers = this.calculateTopOfficers(allCases);

    return {
      overview: {
        totalCases: totalCaseCount,
        totalPersons: allPersons.length,
        totalEvidence: allEvidence.length,
        totalOfficers: 200, // Placeholder - fetch from OfficerRepository
        totalStations: 15, // Placeholder - fetch from Station model
        wantedPersons,
        missingPersons,
        stolenVehicles,
      },
      caseMetrics: {
        byStatus,
        byCategory,
        bySeverity,
      },
      geographicDistribution,
      trends: {
        last7Days,
        last30Days,
        last12Months,
      },
      topOfficers,
    };
  }

  // ========================
  // PRIVATE HELPER METHODS
  // ========================

  private validateDateRange(dateRange: DateRangeFilter): void {
    if (dateRange.startDate >= dateRange.endDate) {
      throw new ValidationError("Start date must be before end date");
    }

    const maxRangeDays = 365; // Max 1 year range
    const rangeDays =
      (dateRange.endDate.getTime() - dateRange.startDate.getTime()) /
      (1000 * 60 * 60 * 24);

    if (rangeDays > maxRangeDays) {
      throw new ValidationError(`Date range cannot exceed ${maxRangeDays} days`);
    }
  }

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

  private groupByFieldWithPercentage<T>(
    items: T[],
    fieldGetter: (item: T) => string,
    total: number
  ): { status: string; count: number; percentage: number }[] {
    const grouped = this.groupByField(items, fieldGetter);
    return grouped.map((g) => ({
      status: g.category,
      count: g.count,
      percentage: total > 0 ? Math.round((g.count / total) * 1000) / 10 : 0,
    }));
  }

  private generateActivityTimeline(
    cases: any[],
    dateRange?: DateRangeFilter
  ): { date: string; count: number }[] {
    const days = dateRange
      ? Math.ceil(
          (dateRange.endDate.getTime() - dateRange.startDate.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 30;

    const timeline: { date: string; count: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      const count = cases.filter((c) => {
        const caseDate = c.createdAt.toISOString().split("T")[0];
        return caseDate === dateStr;
      }).length;

      timeline.push({ date: dateStr, count });
    }

    return timeline;
  }

  private generateCaseTrendTimeline(
    cases: any[],
    dateRange: DateRangeFilter
  ): CaseTrendDataPoint[] {
    const days = Math.ceil(
      (dateRange.endDate.getTime() - dateRange.startDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    const timeline: CaseTrendDataPoint[] = [];

    for (let i = 0; i <= days; i++) {
      const date = new Date(
        dateRange.startDate.getTime() + i * 24 * 60 * 60 * 1000
      );
      const dateStr = date.toISOString().split("T")[0];

      const casesOnDate = cases.filter((c) => {
        const caseDate = c.createdAt.toISOString().split("T")[0];
        return caseDate === dateStr;
      });

      timeline.push({
        date: dateStr,
        open: casesOnDate.filter((c) => c.status === "open").length,
        investigating: casesOnDate.filter((c) => c.status === "investigating")
          .length,
        charged: casesOnDate.filter((c) => c.status === "charged").length,
        court: casesOnDate.filter((c) => c.status === "court").length,
        closed: casesOnDate.filter((c) => c.status === "closed").length,
        total: casesOnDate.length,
      });
    }

    return timeline;
  }

  private calculateCategoryBreakdown(
    cases: any[],
    dateRange: DateRangeFilter
  ): { category: string; count: number; percentageChange: number }[] {
    const categoryBreakdown = this.groupByField(cases, (c) => c.category);

    // Calculate percentage change (compare to previous period)
    // For simplicity, using 0 as placeholder
    return categoryBreakdown.map((cb) => ({
      ...cb,
      percentageChange: 0, // Would calculate from previous period
    }));
  }

  private calculateSeverityBreakdown(
    cases: any[],
    dateRange: DateRangeFilter
  ): { severity: string; count: number; percentageChange: number }[] {
    const severityBreakdown = this.groupByField(cases, (c) => c.severity);

    return severityBreakdown.map((sb) => ({
      severity: sb.category,
      count: sb.count,
      percentageChange: 0, // Would calculate from previous period
    }));
  }

  private calculateResolutionMetrics(cases: any[]): {
    averageResolutionDays: number;
    resolutionRate: number;
    medianResolutionDays: number;
    staleCases: number;
  } {
    const closedCases = cases.filter((c) => c.status === "closed");
    const resolutionRate =
      cases.length > 0 ? (closedCases.length / cases.length) * 100 : 0;

    const averageResolutionDays = this.calculateAverageResolutionDays(closedCases);

    // Calculate median
    const resolutionDays = closedCases
      .map((c) =>
        c.closedAt
          ? (c.closedAt.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          : 0
      )
      .sort((a, b) => a - b);

    const medianResolutionDays =
      resolutionDays.length > 0
        ? resolutionDays[Math.floor(resolutionDays.length / 2)]
        : 0;

    // Stale cases (30+ days no activity)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const staleCases = cases.filter(
      (c) => c.status !== "closed" && c.updatedAt < thirtyDaysAgo
    ).length;

    return {
      averageResolutionDays: Math.round(averageResolutionDays * 10) / 10,
      resolutionRate: Math.round(resolutionRate * 10) / 10,
      medianResolutionDays: Math.round(medianResolutionDays * 10) / 10,
      staleCases,
    };
  }

  private calculateAverageResolutionDays(closedCases: any[]): number {
    if (closedCases.length === 0) return 0;

    const totalDays = closedCases.reduce((sum, c) => {
      const resolutionTime = c.closedAt
        ? c.closedAt.getTime() - c.createdAt.getTime()
        : 0;
      return sum + resolutionTime / (1000 * 60 * 60 * 24);
    }, 0);

    return totalDays / closedCases.length;
  }

  private async getTopStationsByCase(
    dateRange: DateRangeFilter
  ): Promise<{ stationId: string; stationName: string; caseCount: number }[]> {
    // Placeholder - would query cases grouped by station
    return [];
  }

  private calculatePercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return Math.round(((newValue - oldValue) / oldValue) * 1000) / 10;
  }

  private calculateGeographicDistribution(
    cases: any[],
    totalCases: number
  ): {
    stationId: string;
    stationCode: string;
    stationName: string;
    caseCount: number;
    percentage: number;
  }[] {
    const grouped = this.groupByField(cases, (c) => c.stationId);

    return grouped.map((g) => ({
      stationId: g.category,
      stationCode: "STATION-CODE", // Placeholder
      stationName: "Station Name", // Placeholder
      caseCount: g.count,
      percentage:
        totalCases > 0 ? Math.round((g.count / totalCases) * 1000) / 10 : 0,
    }));
  }

  private generateTrendData(
    cases: any[],
    days: number
  ): { date: string; count: number }[] {
    const timeline: { date: string; count: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      const count = cases.filter((c) => {
        const caseDate = c.createdAt.toISOString().split("T")[0];
        return caseDate === dateStr;
      }).length;

      timeline.push({ date: dateStr, count });
    }

    return timeline;
  }

  private generateMonthlyTrendData(
    cases: any[],
    months: number
  ): { month: string; count: number }[] {
    const timeline: { month: string; count: number }[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toISOString().substring(0, 7); // YYYY-MM

      const count = cases.filter((c) => {
        const caseMonth = c.createdAt.toISOString().substring(0, 7);
        return caseMonth === monthStr;
      }).length;

      timeline.push({ month: monthStr, count });
    }

    return timeline;
  }

  private calculateTopOfficers(cases: any[]): {
    officerId: string;
    officerBadge: string;
    officerName: string;
    casesClosed: number;
  }[] {
    const officerStats = cases
      .filter((c) => c.status === "closed")
      .reduce(
        (acc, c) => {
          const officerId = c.assignedOfficerId;
          if (!acc[officerId]) {
            acc[officerId] = {
              officerId,
              officerBadge: officerId, // Placeholder
              officerName: "Officer Name", // Placeholder
              casesClosed: 0,
            };
          }
          acc[officerId].casesClosed++;
          return acc;
        },
        {} as Record<
          string,
          {
            officerId: string;
            officerBadge: string;
            officerName: string;
            casesClosed: number;
          }
        >
      );

    return Object.values(officerStats)
      .sort((a: any, b: any) => b.casesClosed - a.casesClosed)
      .slice(0, 10) as { officerId: string; officerBadge: string; officerName: string; casesClosed: number; }[]; // Top 10
  }
}

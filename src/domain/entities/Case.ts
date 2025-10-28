/**
 * Case Domain Entity
 *
 * Pure business object with domain logic for criminal cases.
 * No database or framework dependencies.
 *
 * Pan-African Design: Supports any country's legal framework
 * Case categories, severity levels, and status workflows can be configured per country
 */
export class Case {
  constructor(
    public readonly id: string,
    public readonly caseNumber: string,
    public readonly title: string,
    public readonly description: string | null,
    public readonly category: string,
    public readonly severity: CaseSeverity,
    public readonly status: CaseStatus,
    public readonly incidentDate: Date,
    public readonly reportedDate: Date,
    public readonly location: string | null,
    public readonly stationId: string,
    public readonly officerId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Check if case is currently open/active
   */
  isOpen(): boolean {
    return this.status !== "closed";
  }

  /**
   * Check if case is in investigation phase
   */
  isUnderInvestigation(): boolean {
    return this.status === "investigating";
  }

  /**
   * Check if case is critical severity
   */
  isCritical(): boolean {
    return this.severity === "critical";
  }

  /**
   * Domain logic: Check if status transition is valid
   * Enforces workflow: open → investigating → charged → court → closed
   * Can close from any state except closed
   */
  canTransitionTo(newStatus: CaseStatus): { allowed: boolean; reason?: string } {
    if (this.status === newStatus) {
      return { allowed: false, reason: `Case is already ${newStatus}` };
    }

    if (this.status === "closed") {
      return { allowed: false, reason: "Cannot change status of closed case" };
    }

    // Allow closing from any non-closed state
    if (newStatus === "closed") {
      return { allowed: true };
    }

    // Valid status transitions
    const validTransitions: Record<CaseStatus, CaseStatus[]> = {
      open: ["investigating", "closed"],
      investigating: ["charged", "closed"],
      charged: ["court", "closed"],
      court: ["closed"],
      closed: [], // No transitions from closed
    };

    const allowedNextStatuses = validTransitions[this.status];
    if (allowedNextStatuses.includes(newStatus)) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `Cannot transition from ${this.status} to ${newStatus}`,
    };
  }

  /**
   * Get days since incident occurred
   */
  getDaysSinceIncident(): number {
    return Math.floor(
      (Date.now() - this.incidentDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  /**
   * Get days since case was reported
   */
  getDaysSinceReported(): number {
    return Math.floor(
      (Date.now() - this.reportedDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  /**
   * Check if case was reported promptly (within 24 hours of incident)
   */
  wasReportedPromptly(): boolean {
    const hoursDifference =
      (this.reportedDate.getTime() - this.incidentDate.getTime()) /
      (1000 * 60 * 60);
    return hoursDifference <= 24;
  }

  /**
   * Check if case is stale (no updates in specified days)
   * Default: 30 days - configurable per country's policies
   */
  isStale(maxDaysWithoutUpdate: number = 30): boolean {
    if (this.status === "closed") return false;

    const daysSinceUpdate = Math.floor(
      (Date.now() - this.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceUpdate > maxDaysWithoutUpdate;
  }

  /**
   * Check if case requires urgent attention
   * Based on severity and time since last update
   */
  requiresUrgentAttention(): boolean {
    if (this.status === "closed") return false;

    if (this.severity === "critical") {
      return this.getDaysSinceReported() > 3; // Critical cases older than 3 days
    }

    if (this.severity === "major") {
      return this.getDaysSinceReported() > 7; // Major cases older than 7 days
    }

    return this.getDaysSinceReported() > 30; // Minor cases older than 30 days
  }

  /**
   * Get case age category
   */
  getAgeCategory(): "recent" | "active" | "aging" | "stale" {
    const days = this.getDaysSinceReported();
    if (days <= 7) return "recent";
    if (days <= 30) return "active";
    if (days <= 90) return "aging";
    return "stale";
  }

  /**
   * Get display-friendly severity label
   */
  getSeverityLabel(): string {
    const labels: Record<CaseSeverity, string> = {
      minor: "Minor",
      major: "Major",
      critical: "Critical",
    };
    return labels[this.severity];
  }

  /**
   * Get display-friendly status label
   */
  getStatusLabel(): string {
    const labels: Record<CaseStatus, string> = {
      open: "Open",
      investigating: "Under Investigation",
      charged: "Charged",
      court: "In Court",
      closed: "Closed",
    };
    return labels[this.status];
  }
}

/**
 * Case Severity Levels
 * Can be customized per country's classification system
 */
export type CaseSeverity = "minor" | "major" | "critical";

/**
 * Case Status Workflow
 * Can be adapted to match local legal processes
 */
export type CaseStatus = "open" | "investigating" | "charged" | "court" | "closed";

/**
 * Case Categories
 * Configurable per country's penal code
 */
export type CaseCategory =
  | "theft"
  | "assault"
  | "fraud"
  | "murder"
  | "robbery"
  | "kidnapping"
  | "drug"
  | "cybercrime"
  | "domestic_violence"
  | "burglary"
  | "arson"
  | "other";

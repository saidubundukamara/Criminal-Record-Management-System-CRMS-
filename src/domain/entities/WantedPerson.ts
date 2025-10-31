/**
 * WantedPerson Domain Entity
 *
 * Represents a person wanted by law enforcement in the criminal records system
 * Includes business logic for danger level assessment, status management, and reward tracking
 *
 * Pan-African Design:
 * - Links to Person entity (supports any national ID system)
 * - Multi-language support for charges/descriptions
 * - USSD-compatible for low-tech dissemination
 * - Regional sharing capabilities
 */

/**
 * Wanted Person Status
 */
export type WantedPersonStatus =
  | "active"    // Currently wanted
  | "captured"  // Person has been apprehended
  | "expired";  // Warrant expired or withdrawn

/**
 * Danger Level Assessment
 */
export type DangerLevel = "low" | "medium" | "high" | "extreme";

/**
 * Criminal Charge
 */
export interface CriminalCharge {
  charge: string;
  category: string;
  severity: "minor" | "major" | "critical";
}

/**
 * WantedPerson Entity
 *
 * Core domain entity for managing wanted persons with business logic
 */
export class WantedPerson {
  constructor(
    public readonly id: string,
    public readonly personId: string,               // Link to Person entity
    public readonly personName: string,             // Cached for display
    public readonly nin: string | null,             // National ID (if known)
    public readonly charges: CriminalCharge[],      // Array of charges
    public readonly dangerLevel: DangerLevel,
    public readonly status: WantedPersonStatus,
    public readonly warrantNumber: string,          // Official warrant ID
    public readonly issuedDate: Date,               // When warrant was issued
    public readonly expiresAt: Date | null,         // Warrant expiration (if any)
    public readonly lastSeenLocation: string | null,
    public readonly lastSeenDate: Date | null,
    public readonly physicalDescription: string,
    public readonly photoUrl: string | null,        // Photo (S3 URL)
    public readonly rewardAmount: number | null,    // Reward in local currency
    public readonly contactPhone: string,           // Tips hotline
    public readonly isRegionalAlert: boolean,       // Share across borders?
    public readonly createdById: string,            // Officer who created
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Check if the person is currently wanted
   */
  isActive(): boolean {
    return this.status === "active" && !this.isExpired();
  }

  /**
   * Check if the warrant has expired
   */
  isExpired(): boolean {
    if (!this.expiresAt) {
      return false; // No expiration set
    }
    return this.expiresAt < new Date();
  }

  /**
   * Check if the person has been captured
   */
  isCaptured(): boolean {
    return this.status === "captured";
  }

  /**
   * Check if the person can be marked as captured
   */
  canBeCaptured(): { allowed: boolean; reason?: string } {
    if (this.status === "captured") {
      return { allowed: false, reason: "Person is already marked as captured" };
    }

    if (this.status === "expired") {
      return { allowed: false, reason: "Cannot capture with expired warrant" };
    }

    if (this.status !== "active") {
      return { allowed: false, reason: "Only active warrants can be captured" };
    }

    return { allowed: true };
  }

  /**
   * Check if the warrant can be expired/withdrawn
   */
  canBeExpired(): { allowed: boolean; reason?: string } {
    if (this.status === "expired") {
      return { allowed: false, reason: "Warrant is already expired" };
    }

    if (this.status === "captured") {
      return { allowed: false, reason: "Cannot expire warrant for captured person" };
    }

    return { allowed: true };
  }

  /**
   * Get danger level color for UI
   */
  getDangerLevelColor(): string {
    const colors: Record<DangerLevel, string> = {
      low: "yellow",
      medium: "orange",
      high: "red",
      extreme: "purple",
    };
    return colors[this.dangerLevel] || "gray";
  }

  /**
   * Get status badge color for UI
   */
  getStatusColor(): string {
    const colors: Record<WantedPersonStatus, string> = {
      active: "red",
      captured: "green",
      expired: "gray",
    };
    return colors[this.status] || "gray";
  }

  /**
   * Get reward display text
   */
  getRewardDisplay(): string {
    if (!this.rewardAmount || this.rewardAmount <= 0) {
      return "No reward offered";
    }

    // Format with thousands separator
    const formatted = this.rewardAmount.toLocaleString();
    return `Reward: ${formatted}`;
  }

  /**
   * Get primary charge (highest severity)
   */
  getPrimaryCharge(): string {
    if (this.charges.length === 0) {
      return "Unknown charges";
    }

    // Sort by severity (critical > major > minor)
    const severityOrder: Record<string, number> = {
      critical: 3,
      major: 2,
      minor: 1,
    };

    const sortedCharges = [...this.charges].sort(
      (a, b) => severityOrder[b.severity] - severityOrder[a.severity]
    );

    return sortedCharges[0].charge;
  }

  /**
   * Get all charges as formatted string
   */
  getChargesSummary(): string {
    if (this.charges.length === 0) {
      return "No charges specified";
    }

    const chargeTexts = this.charges.map((c) => c.charge);
    return chargeTexts.join(", ");
  }

  /**
   * Get number of critical charges
   */
  getCriticalChargeCount(): number {
    return this.charges.filter((c) => c.severity === "critical").length;
  }

  /**
   * Check if person is wanted for critical crimes
   */
  hasCriticalCharges(): boolean {
    return this.getCriticalChargeCount() > 0;
  }

  /**
   * Get days since warrant was issued
   */
  getDaysSinceIssued(): number {
    const now = new Date();
    const diffTime = now.getTime() - this.issuedDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get days since last seen
   */
  getDaysSinceLastSeen(): number | null {
    if (!this.lastSeenDate) {
      return null;
    }

    const now = new Date();
    const diffTime = now.getTime() - this.lastSeenDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get days until warrant expiration
   */
  getDaysUntilExpiration(): number | null {
    if (!this.expiresAt) {
      return null; // No expiration
    }

    const now = new Date();
    const diffTime = this.expiresAt.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if warrant is expiring soon (within 30 days)
   */
  isExpiringSoon(): boolean {
    const daysUntil = this.getDaysUntilExpiration();
    return daysUntil !== null && daysUntil > 0 && daysUntil <= 30;
  }

  /**
   * Get warrant age category
   */
  getWarrantAgeCategory(): "new" | "recent" | "old" {
    const daysSinceIssued = this.getDaysSinceIssued();

    if (daysSinceIssued <= 30) {
      return "new";
    }

    if (daysSinceIssued <= 180) {
      return "recent"; // Within 6 months
    }

    return "old";
  }

  /**
   * Get broadcast message for public alerts
   */
  getBroadcastMessage(): string {
    const charge = this.getPrimaryCharge();
    const dangerText = this.dangerLevel === "extreme" || this.dangerLevel === "high"
      ? " CAUTION: Considered dangerous."
      : "";
    const locationText = this.lastSeenLocation
      ? ` Last seen: ${this.lastSeenLocation}.`
      : "";
    const rewardText = this.rewardAmount
      ? ` ${this.getRewardDisplay()}.`
      : "";

    return `WANTED: ${this.personName} - ${charge}.${dangerText}${locationText}${rewardText} Contact: ${this.contactPhone}`;
  }

  /**
   * Get USSD-friendly short message (max 160 characters)
   */
  getUSSDMessage(): string {
    const charge = this.getPrimaryCharge().substring(0, 30);
    const dangerFlag = this.dangerLevel === "extreme" ? " [DANGER]" : "";
    const location = this.lastSeenLocation
      ? ` ${this.lastSeenLocation.substring(0, 15)}`
      : "";

    return `WANTED: ${this.personName}${dangerFlag} - ${charge}.${location} Call ${this.contactPhone}`;
  }

  /**
   * Validate if the wanted person record is complete
   */
  isValid(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.personName || this.personName.trim().length === 0) {
      errors.push("Person name is required");
    }

    if (!this.charges || this.charges.length === 0) {
      errors.push("At least one charge is required");
    }

    if (!this.warrantNumber || this.warrantNumber.trim().length === 0) {
      errors.push("Warrant number is required");
    }

    if (!this.physicalDescription || this.physicalDescription.trim().length === 0) {
      errors.push("Physical description is required");
    }

    if (!this.contactPhone || this.contactPhone.trim().length === 0) {
      errors.push("Contact phone number is required");
    }

    // Validate reward amount
    if (this.rewardAmount !== null && this.rewardAmount < 0) {
      errors.push("Reward amount cannot be negative");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if warrant should be auto-expired
   */
  shouldAutoExpire(maxDaysActive: number = 365): boolean {
    const daysSinceIssued = this.getDaysSinceIssued();
    return (
      this.status === "active" &&
      daysSinceIssued >= maxDaysActive &&
      !this.isExpired()
    );
  }

  /**
   * Check if this is a regional/cross-border alert
   */
  isRegional(): boolean {
    return this.isRegionalAlert === true;
  }

  /**
   * Get display age text for warrant
   */
  getWarrantAgeDisplay(): string {
    const days = this.getDaysSinceIssued();

    if (days === 0) {
      return "Issued today";
    }

    if (days === 1) {
      return "Issued yesterday";
    }

    if (days < 7) {
      return `Issued ${days} days ago`;
    }

    if (days < 30) {
      const weeks = Math.floor(days / 7);
      return `Issued ${weeks} week${weeks > 1 ? "s" : ""} ago`;
    }

    if (days < 365) {
      const months = Math.floor(days / 30);
      return `Issued ${months} month${months > 1 ? "s" : ""} ago`;
    }

    const years = Math.floor(days / 365);
    return `Issued ${years} year${years > 1 ? "s" : ""} ago`;
  }

  /**
   * Get priority score for sorting (higher = more urgent)
   */
  getPriorityScore(): number {
    let score = 0;

    // Danger level weight (0-40 points)
    const dangerWeight: Record<DangerLevel, number> = {
      extreme: 40,
      high: 30,
      medium: 20,
      low: 10,
    };
    score += dangerWeight[this.dangerLevel];

    // Recent sightings add urgency (0-30 points)
    const daysSinceLastSeen = this.getDaysSinceLastSeen();
    if (daysSinceLastSeen !== null) {
      if (daysSinceLastSeen <= 7) {
        score += 30; // Seen in last week
      } else if (daysSinceLastSeen <= 30) {
        score += 20; // Seen in last month
      } else if (daysSinceLastSeen <= 90) {
        score += 10; // Seen in last 3 months
      }
    }

    // Critical charges add weight (0-20 points)
    score += Math.min(this.getCriticalChargeCount() * 10, 20);

    // Reward indicates importance (0-10 points)
    if (this.rewardAmount && this.rewardAmount > 0) {
      score += 10;
    }

    return score;
  }
}

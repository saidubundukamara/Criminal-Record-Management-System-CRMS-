/**
 * BackgroundCheck Domain Entity
 *
 * Represents a background check request and result in the criminal records system
 * Includes business logic for result validation, expiration, and redaction
 *
 * Pan-African Design:
 * - NIN field is flexible (works with any national ID system)
 * - Request types support different use cases (officer, citizen, employer, visa)
 * - Redacted results for citizen/public requests
 * - Certificate generation for official requests
 */

/**
 * Background Check Request Types
 */
export type BackgroundCheckRequestType =
  | "officer"    // Police officer internal check (full details)
  | "citizen"    // Citizen self-check (redacted)
  | "employer"   // Employment screening (limited details)
  | "visa";      // Visa/immigration (official certificate)

/**
 * Background Check Status
 */
export type BackgroundCheckStatus =
  | "pending"    // Check in progress
  | "completed"  // Check completed successfully
  | "failed";    // Check failed (NIN not found, system error, etc.)

/**
 * Criminal History Summary
 */
export interface CriminalHistoryRecord {
  caseNumber: string;
  category: string;
  severity: string;
  status: string;
  incidentDate: Date;
  outcome?: string;
}

/**
 * Background Check Result
 */
export interface BackgroundCheckResult {
  status: "clear" | "record_found";
  message: string;
  recordsCount?: number;
  criminalHistory?: CriminalHistoryRecord[];
  riskLevel?: "low" | "medium" | "high";
  lastUpdated: Date;
}

/**
 * BackgroundCheck Entity
 *
 * Core domain entity for managing background check requests and results
 */
export class BackgroundCheck {
  constructor(
    public readonly id: string,
    public readonly nin: string,                              // National ID searched
    public readonly requestedById: string | null,             // Officer who requested (null for citizen USSD)
    public readonly requestType: BackgroundCheckRequestType,
    public readonly result: BackgroundCheckResult,
    public readonly status: BackgroundCheckStatus,
    public readonly issuedAt: Date | null,                    // When certificate was issued
    public readonly expiresAt: Date | null,                   // When result expires
    public readonly certificateUrl: string | null,            // S3 URL for PDF certificate
    public readonly phoneNumber: string | null,               // For USSD requests
    public readonly ipAddress: string | null,                 // For audit trail
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Check if the background check result has expired
   */
  isExpired(): boolean {
    if (!this.expiresAt) {
      return false; // No expiration set
    }
    return this.expiresAt < new Date();
  }

  /**
   * Check if the result should be redacted (citizen/public view)
   */
  shouldBeRedacted(): boolean {
    return this.requestType === "citizen" || this.requestType === "employer";
  }

  /**
   * Check if this is a citizen self-check request
   */
  isCitizenRequest(): boolean {
    return this.requestType === "citizen";
  }

  /**
   * Check if this is an officer internal check
   */
  isOfficerRequest(): boolean {
    return this.requestType === "officer";
  }

  /**
   * Check if a certificate can be generated
   */
  canGenerateCertificate(): boolean {
    return (
      this.status === "completed" &&
      (this.requestType === "visa" || this.requestType === "employer") &&
      !this.isExpired()
    );
  }

  /**
   * Check if the check was completed successfully
   */
  isCompleted(): boolean {
    return this.status === "completed";
  }

  /**
   * Check if the person has a criminal record
   */
  hasCriminalRecord(): boolean {
    return this.result.status === "record_found" &&
           (this.result.recordsCount ?? 0) > 0;
  }

  /**
   * Get a redacted version of the result (for citizen/public view)
   */
  getRedactedResult(): BackgroundCheckResult {
    if (!this.shouldBeRedacted()) {
      return this.result; // Return full result for authorized requests
    }

    // Return minimal information for citizen/employer requests
    return {
      status: this.result.status,
      message: this.result.status === "clear"
        ? "No criminal records found"
        : "Criminal record exists. Please visit your nearest police station for details.",
      lastUpdated: this.result.lastUpdated,
    };
  }

  /**
   * Get summary of criminal history for display
   */
  getCriminalHistorySummary(): string {
    if (!this.hasCriminalRecord()) {
      return "No criminal record found";
    }

    const count = this.result.recordsCount ?? 0;
    const cases = this.result.criminalHistory ?? [];

    if (this.shouldBeRedacted()) {
      return `${count} record(s) found. Visit police station for details.`;
    }

    // For officer/official requests, provide detailed summary
    const categoriesMap = new Map<string, number>();
    cases.forEach(record => {
      const count = categoriesMap.get(record.category) || 0;
      categoriesMap.set(record.category, count + 1);
    });

    const categories = Array.from(categoriesMap.entries())
      .map(([category, count]) => `${category} (${count})`)
      .join(", ");

    return `${count} record(s) found: ${categories}`;
  }

  /**
   * Get days until expiration
   */
  getDaysUntilExpiration(): number | null {
    if (!this.expiresAt) {
      return null;
    }

    const now = new Date();
    const diffTime = this.expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  /**
   * Check if the check is about to expire (within 7 days)
   */
  isExpiringsoon(): boolean {
    const daysUntil = this.getDaysUntilExpiration();
    return daysUntil !== null && daysUntil > 0 && daysUntil <= 7;
  }

  /**
   * Get risk level for display
   */
  getRiskLevel(): "low" | "medium" | "high" | "unknown" {
    if (!this.hasCriminalRecord()) {
      return "low";
    }

    return this.result.riskLevel ?? "unknown";
  }

  /**
   * Get risk level color for UI
   */
  getRiskLevelColor(): string {
    const level = this.getRiskLevel();
    const colors: Record<string, string> = {
      low: "green",
      medium: "yellow",
      high: "red",
      unknown: "gray",
    };
    return colors[level] || "gray";
  }

  /**
   * Get certificate expiry date (90 days from issue)
   */
  getCertificateExpiryDate(): Date | null {
    if (!this.issuedAt) {
      return null;
    }

    const expiry = new Date(this.issuedAt);
    expiry.setDate(expiry.getDate() + 90); // 90-day validity
    return expiry;
  }

  /**
   * Validate if the check meets requirements for visa applications
   */
  isValidForVisa(): { valid: boolean; reason?: string } {
    if (this.requestType !== "visa") {
      return { valid: false, reason: "Not a visa request" };
    }

    if (this.status !== "completed") {
      return { valid: false, reason: "Check not completed" };
    }

    if (this.isExpired()) {
      return { valid: false, reason: "Result has expired" };
    }

    if (!this.certificateUrl) {
      return { valid: false, reason: "No certificate generated" };
    }

    return { valid: true };
  }

  /**
   * Get display message based on result and request type
   */
  getDisplayMessage(): string {
    if (this.status === "pending") {
      return "Background check in progress...";
    }

    if (this.status === "failed") {
      return "Background check failed. Please try again or contact support.";
    }

    // Completed checks
    if (this.shouldBeRedacted()) {
      return this.getRedactedResult().message;
    }

    // Full details for officer requests
    return this.getCriminalHistorySummary();
  }

  /**
   * Check if this check was performed via USSD
   */
  isUSSDRequest(): boolean {
    return this.phoneNumber !== null && this.requestedById === null;
  }

  /**
   * Get the age of this background check in days
   */
  getAgeInDays(): number {
    const now = new Date();
    const diffTime = now.getTime() - this.createdAt.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }
}

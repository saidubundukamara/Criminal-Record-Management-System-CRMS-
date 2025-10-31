/**
 * AmberAlert Domain Entity
 *
 * Represents an Amber Alert for a missing child in the criminal records system
 * Includes business logic for alert validation, expiration, and status management
 *
 * Pan-African Design:
 * - Supports children of all countries in the region
 * - Multi-language support for alert broadcasting
 * - USSD-compatible for low-tech dissemination
 * - SMS broadcasting integration
 */

/**
 * Amber Alert Status
 */
export type AmberAlertStatus =
  | "active"    // Alert is active and being broadcast
  | "found"     // Child has been found (safe)
  | "expired";  // Alert has expired (auto-expire after 30 days)

/**
 * Gender Options
 */
export type Gender = "male" | "female" | "unknown";

/**
 * AmberAlert Entity
 *
 * Core domain entity for managing Amber Alerts with business logic
 */
export class AmberAlert {
  constructor(
    public readonly id: string,
    public readonly personName: string,              // Name of missing child
    public readonly age: number | null,              // Age at time of disappearance
    public readonly gender: Gender | null,
    public readonly description: string,             // Physical description
    public readonly photoUrl: string | null,         // Photo of child (S3 URL)
    public readonly lastSeenLocation: string | null, // Last known location
    public readonly lastSeenDate: Date | null,       // When last seen
    public readonly contactPhone: string,            // Contact number for tips
    public readonly status: AmberAlertStatus,
    public readonly publishedAt: Date | null,        // When alert was published/activated
    public readonly expiresAt: Date | null,          // Auto-expire date (30 days default)
    public readonly createdById: string,             // Officer who created alert
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Check if the alert is currently active
   */
  isActive(): boolean {
    return this.status === "active" && !this.isExpired();
  }

  /**
   * Check if the alert has expired
   */
  isExpired(): boolean {
    if (!this.expiresAt) {
      return false;
    }
    return this.expiresAt < new Date();
  }

  /**
   * Check if the child was found
   */
  isFound(): boolean {
    return this.status === "found";
  }

  /**
   * Check if the alert can be resolved (marked as found)
   */
  canBeResolved(): { allowed: boolean; reason?: string } {
    if (this.status === "found") {
      return { allowed: false, reason: "Alert already marked as found" };
    }

    if (this.status === "expired") {
      return { allowed: false, reason: "Cannot resolve expired alert" };
    }

    if (this.status !== "active") {
      return { allowed: false, reason: "Only active alerts can be resolved" };
    }

    return { allowed: true };
  }

  /**
   * Check if the alert can be activated/published
   */
  canBeActivated(): { allowed: boolean; reason?: string } {
    if (this.status === "active") {
      return { allowed: false, reason: "Alert is already active" };
    }

    if (this.status === "found") {
      return { allowed: false, reason: "Child was found, cannot reactivate" };
    }

    if (!this.age || this.age >= 18) {
      return { allowed: false, reason: "Amber Alerts are only for children under 18" };
    }

    return { allowed: true };
  }

  /**
   * Get the number of days since the child went missing
   */
  getDaysMissing(): number | null {
    if (!this.lastSeenDate) {
      return null;
    }

    const now = new Date();
    const diffTime = now.getTime() - this.lastSeenDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  /**
   * Get the number of days the alert has been active
   */
  getDaysActive(): number | null {
    if (!this.publishedAt) {
      return null; // Alert not yet published
    }

    const now = new Date();
    const diffTime = now.getTime() - this.publishedAt.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  /**
   * Get the number of days until expiration
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
   * Check if the alert is expiring soon (within 3 days)
   */
  isExpiringSoon(): boolean {
    const daysUntil = this.getDaysUntilExpiration();
    return daysUntil !== null && daysUntil > 0 && daysUntil <= 3;
  }

  /**
   * Get urgency level based on days missing
   */
  getUrgencyLevel(): "critical" | "high" | "medium" {
    const daysMissing = this.getDaysMissing();

    if (!daysMissing || daysMissing === 0) {
      return "critical"; // Just reported
    }

    if (daysMissing <= 2) {
      return "critical"; // First 48 hours are critical
    }

    if (daysMissing <= 7) {
      return "high"; // First week
    }

    return "medium";
  }

  /**
   * Get urgency color for UI
   */
  getUrgencyColor(): string {
    const urgency = this.getUrgencyLevel();
    const colors: Record<string, string> = {
      critical: "red",
      high: "orange",
      medium: "yellow",
    };
    return colors[urgency] || "yellow";
  }

  /**
   * Get status badge color for UI
   */
  getStatusColor(): string {
    const colors: Record<AmberAlertStatus, string> = {
      active: "blue",
      found: "green",
      expired: "gray",
    };
    return colors[this.status] || "gray";
  }

  /**
   * Check if the subject is a minor (under 18)
   */
  isMinor(): boolean {
    return this.age !== null && this.age < 18;
  }

  /**
   * Get display age text
   */
  getAgeDisplay(): string {
    if (!this.age) {
      return "Age unknown";
    }

    if (this.age < 1) {
      return "Infant";
    }

    if (this.age === 1) {
      return "1 year old";
    }

    return `${this.age} years old`;
  }

  /**
   * Get full description for broadcasting
   */
  getBroadcastMessage(): string {
    const ageTxt = this.getAgeDisplay();
    const genderText = this.gender ? ` ${this.gender}` : "";
    const locationText = this.lastSeenLocation
      ? ` Last seen: ${this.lastSeenLocation}.`
      : "";
    const dateText = this.lastSeenDate
      ? ` Missing since: ${this.lastSeenDate.toLocaleDateString()}.`
      : "";

    return `AMBER ALERT: Missing child - ${this.personName}, ${ageTxt}${genderText}.${locationText}${dateText} Contact: ${this.contactPhone}`;
  }

  /**
   * Get USSD-friendly short message (max 160 characters)
   */
  getUSSDMessage(): string {
    const ageTxt = this.age || "?";
    const genderTxt = this.gender ? this.gender[0].toUpperCase() : "?";
    const location = this.lastSeenLocation
      ? ` ${this.lastSeenLocation.substring(0, 20)}`
      : "";

    return `AMBER: ${this.personName}, ${ageTxt}y ${genderTxt}.${location}. Call ${this.contactPhone}`;
  }

  /**
   * Validate if the alert meets minimum requirements
   */
  isValid(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.personName || this.personName.trim().length === 0) {
      errors.push("Person name is required");
    }

    if (!this.age || this.age >= 18) {
      errors.push("Amber Alerts are only for children under 18");
    }

    if (this.age && this.age < 0) {
      errors.push("Age cannot be negative");
    }

    if (!this.description || this.description.trim().length === 0) {
      errors.push("Description is required");
    }

    if (!this.contactPhone || this.contactPhone.trim().length === 0) {
      errors.push("Contact phone number is required");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if the alert should be auto-expired
   */
  shouldAutoExpire(maxDaysActive: number = 30): boolean {
    const daysActive = this.getDaysActive();
    return (
      this.status === "active" &&
      daysActive !== null &&
      daysActive >= maxDaysActive
    );
  }

  /**
   * Get alert age category
   */
  getAgeCategory(): "new" | "recent" | "old" {
    const daysActive = this.getDaysActive();

    if (!daysActive) {
      return "new";
    }

    if (daysActive <= 7) {
      return "new";
    }

    if (daysActive <= 21) {
      return "recent";
    }

    return "old";
  }
}

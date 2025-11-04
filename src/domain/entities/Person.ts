/**
 * Person Domain Entity
 *
 * Represents a person in the criminal records system (suspect, victim, witness, informant)
 * Includes business logic for PII handling, validation, and identity verification
 *
 * Pan-African Design:
 * - National ID field is configurable per country (Sierra Leone NIN, Ghana Card, Nigerian NIN, etc.)
 * - Supports multiple aliases for tracking known names
 * - Encrypted PII for privacy compliance (GDPR, Malabo Convention)
 * - Biometric support for fingerprint identification
 */

/**
 * Person Types (roles in cases)
 */
export type PersonType = "suspect" | "victim" | "witness" | "informant";

/**
 * Gender Options
 */
export type Gender = "male" | "female" | "other" | "unknown";

/**
 * Encrypted PII Data Structure
 */
export interface EncryptedAddress {
  type: "residence" | "work" | "previous";
  street?: string;
  city?: string;
  region?: string;
  country?: string;
  postalCode?: string;
}

export interface EncryptedContact {
  phoneNumbers: string[];
  emails: string[];
}

/**
 * Person Entity
 *
 * Core domain entity for managing person records with business logic
 */
export class Person {
  constructor(
    public readonly id: string,
    public readonly nationalId: string | null, // National Identification Number (configurable per country)
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly middleName: string | null,
    public readonly aliases: string[], // Array of known aliases
    public readonly dateOfBirth: Date | null,
    public readonly gender: Gender,
    public readonly nationality: string | null,
    public readonly placeOfBirth: string | null,
    public readonly occupation: string | null,
    public readonly maritalStatus: string | null,
    public readonly educationLevel: string | null,
    public readonly tribe: string | null, // Relevant in many African contexts
    public readonly religion: string | null,
    public readonly languagesSpoken: string[], // Multi-language support
    public readonly physicalDescription: string | null, // Height, build, distinguishing marks
    public readonly photoUrl: string | null, // S3 photo URL
    public readonly addresses: EncryptedAddress[], // Encrypted PII
    public readonly phoneNumbers: string[], // Encrypted PII
    public readonly emails: string[], // Encrypted PII
    public readonly fingerprintHash: string | null, // SHA-256 hash for matching
    public readonly biometricHash: string | null, // Other biometric data hash
    public readonly criminalHistory: string | null, // Brief summary
    public readonly riskLevel: "low" | "medium" | "high" | null, // Risk assessment
    public readonly isWanted: boolean, // Wanted person flag
    public readonly isDeceasedOrMissing: boolean, // Deceased or missing flag
    public readonly notes: string | null,
    public readonly stationId: string, // Station that created the record
    public readonly createdBy: string, // Officer who created
    public readonly updatedBy: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Get full name with middle name if available
   */
  getFullName(): string {
    if (this.middleName) {
      return `${this.firstName} ${this.middleName} ${this.lastName}`;
    }
    return `${this.firstName} ${this.lastName}`;
  }

  /**
   * Get display name with aliases
   */
  getDisplayName(): string {
    const fullName = this.getFullName();
    if (this.aliases.length > 0) {
      return `${fullName} (aka ${this.aliases.join(", ")})`;
    }
    return fullName;
  }

  /**
   * Calculate age from date of birth
   */
  getAge(): number | null {
    if (!this.dateOfBirth) {
      return null;
    }

    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Check if person is a minor (under 18)
   */
  isMinor(): boolean {
    const age = this.getAge();
    return age !== null && age < 18;
  }

  /**
   * Check if person is a senior (65+)
   */
  isSenior(): boolean {
    const age = this.getAge();
    return age !== null && age >= 65;
  }

  /**
   * Get age category for reporting
   */
  getAgeCategory(): "minor" | "young_adult" | "adult" | "senior" | "unknown" {
    const age = this.getAge();
    if (age === null) return "unknown";
    if (age < 18) return "minor";
    if (age < 30) return "young_adult";
    if (age < 65) return "adult";
    return "senior";
  }

  /**
   * Check if person has complete identification
   */
  hasCompleteIdentification(): boolean {
    return (
      this.nationalId !== null &&
      this.dateOfBirth !== null &&
      this.nationality !== null &&
      this.addresses.length > 0
    );
  }

  /**
   * Check if person has biometric data
   */
  hasBiometricData(): boolean {
    return this.fingerprintHash !== null || this.biometricHash !== null;
  }

  /**
   * Check if person has contact information
   */
  hasContactInfo(): boolean {
    return this.phoneNumbers.length > 0 || this.emails.length > 0;
  }

  /**
   * Get primary address (first residence or any address)
   */
  getPrimaryAddress(): EncryptedAddress | null {
    const residenceAddress = this.addresses.find((addr) => addr.type === "residence");
    return residenceAddress || this.addresses[0] || null;
  }

  /**
   * Get primary phone number
   */
  getPrimaryPhone(): string | null {
    return this.phoneNumbers[0] || null;
  }

  /**
   * Get primary email
   */
  getPrimaryEmail(): string | null {
    return this.emails[0] || null;
  }

  /**
   * Check if person requires special handling (minor or wanted)
   */
  requiresSpecialHandling(): boolean {
    return this.isMinor() || this.isWanted || this.riskLevel === "high";
  }

  /**
   * Get risk assessment label
   */
  getRiskLabel(): string {
    if (this.riskLevel === "high") return "High Risk";
    if (this.riskLevel === "medium") return "Medium Risk";
    if (this.riskLevel === "low") return "Low Risk";
    return "Not Assessed";
  }

  /**
   * Check if person record is complete enough for case assignment
   */
  isValidForCaseAssignment(): { valid: boolean; missingFields: string[] } {
    const missingFields: string[] = [];

    if (!this.firstName) missingFields.push("First Name");
    if (!this.lastName) missingFields.push("Last Name");
    if (!this.dateOfBirth) missingFields.push("Date of Birth");
    if (!this.gender || this.gender === "unknown") missingFields.push("Gender");

    return {
      valid: missingFields.length === 0,
      missingFields,
    };
  }

  /**
   * Generate searchable text for full-text search
   */
  getSearchableText(): string {
    const parts: string[] = [
      this.firstName,
      this.middleName || "",
      this.lastName,
      ...this.aliases,
      this.nationalId || "",
      this.nationality || "",
      this.occupation || "",
      this.tribe || "",
      this.placeOfBirth || "",
    ];

    return parts.filter((p) => p).join(" ").toLowerCase();
  }

  /**
   * Get data completeness percentage (for UI display)
   */
  getDataCompletenessPercentage(): number {
    const fields = [
      this.nationalId,
      this.firstName,
      this.lastName,
      this.dateOfBirth,
      this.gender !== "unknown",
      this.nationality,
      this.placeOfBirth,
      this.occupation,
      this.addresses.length > 0,
      this.phoneNumbers.length > 0,
      this.photoUrl,
      this.fingerprintHash,
    ];

    const filledFields = fields.filter((f) => f).length;
    return Math.round((filledFields / fields.length) * 100);
  }

  /**
   * Validate National ID format (country-specific, override per deployment)
   * Default: alphanumeric, 8-20 characters
   */
  static isValidNationalId(nationalId: string, countryCode?: string): boolean {
    // Base validation
    if (!nationalId || nationalId.length < 8 || nationalId.length > 20) {
      return false;
    }

    // Country-specific validation can be added here
    // Example for Sierra Leone: NIN format is typically 11 digits
    if (countryCode === "SLE") {
      return /^\d{11}$/.test(nationalId);
    }

    // Default: alphanumeric
    return /^[A-Z0-9]+$/i.test(nationalId);
  }

  /**
   * Check if person can be marked as wanted
   */
  canBeMarkedAsWanted(): { allowed: boolean; reason?: string } {
    if (this.isDeceasedOrMissing) {
      return { allowed: false, reason: "Cannot mark deceased/missing person as wanted" };
    }

    if (!this.hasCompleteIdentification()) {
      return {
        allowed: false,
        reason: "Person must have complete identification (National ID, DOB, nationality, address)",
      };
    }

    return { allowed: true };
  }

  /**
   * Create a redacted version for citizen-facing APIs
   * Removes sensitive PII and criminal history
   */
  toRedactedVersion(): Partial<Person> {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      dateOfBirth: this.dateOfBirth,
      gender: this.gender,
      nationality: this.nationality,
      // All other fields redacted
    };
  }
}

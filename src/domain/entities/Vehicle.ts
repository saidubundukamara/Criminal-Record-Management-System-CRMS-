/**
 * Vehicle Domain Entity
 *
 * Represents vehicles in the criminal records system for tracking ownership,
 * stolen status, and impoundment records
 *
 * Pan-African Design:
 * - Country-agnostic license plate formats
 * - USSD-compatible status checking
 * - Offline-first vehicle registration
 * - Cross-border stolen vehicle tracking
 */

/**
 * Vehicle Types
 */
export type VehicleType =
  | "car"
  | "truck"
  | "motorcycle"
  | "bus"
  | "van"
  | "bicycle"
  | "tricycle" // Common in West Africa (keke)
  | "other";

/**
 * Vehicle Status
 */
export type VehicleStatus =
  | "active" // Normal status, no issues
  | "stolen" // Reported stolen
  | "impounded" // Seized by police
  | "recovered"; // Stolen vehicle recovered

/**
 * Vehicle Domain Entity
 * Encapsulates vehicle data and business logic
 */
export class Vehicle {
  constructor(
    public readonly id: string,
    public readonly licensePlate: string,
    public readonly ownerNIN: string | null,
    public readonly ownerName: string | null,
    public readonly vehicleType: VehicleType,
    public readonly make: string | null,
    public readonly model: string | null,
    public readonly color: string | null,
    public readonly year: number | null,
    public readonly status: VehicleStatus,
    public readonly stolenDate: Date | null,
    public readonly stolenReportedBy: string | null,
    public readonly recoveredDate: Date | null,
    public readonly notes: string | null,
    public readonly stationId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Business Logic Methods
   */

  /**
   * Check if vehicle is currently stolen (reported but not yet recovered)
   */
  isStolen(): boolean {
    return this.status === "stolen" && !this.recoveredDate;
  }

  /**
   * Check if vehicle has been recovered
   */
  isRecovered(): boolean {
    return this.status === "stolen" && !!this.recoveredDate;
  }

  /**
   * Check if vehicle is impounded
   */
  isImpounded(): boolean {
    return this.status === "impounded";
  }

  /**
   * Calculate duration vehicle has been stolen (in days)
   * Returns null if not stolen
   */
  getStolenDuration(): number | null {
    if (!this.stolenDate) return null;
    const endDate = this.recoveredDate || new Date();
    return Math.floor(
      (endDate.getTime() - this.stolenDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  /**
   * Calculate age of vehicle (in years)
   */
  getAge(): number | null {
    if (!this.year) return null;
    const currentYear = new Date().getFullYear();
    return currentYear - this.year;
  }

  /**
   * Get formatted license plate (uppercase, trimmed)
   */
  getFormattedPlate(): string {
    return this.licensePlate.toUpperCase().trim();
  }

  /**
   * Get USSD-compatible summary (160 chars max)
   * Used for USSD vehicle check responses
   */
  getUSSDSummary(): string {
    if (this.isStolen()) {
      const duration = this.getStolenDuration();
      return `STOLEN - ${this.licensePlate}\n${this.vehicleType.toUpperCase()}\nReported: ${this.stolenDate?.toLocaleDateString()}\n${duration}d ago`;
    }

    if (this.isImpounded()) {
      return `IMPOUNDED - ${this.licensePlate}\n${this.vehicleType.toUpperCase()}\nOwner: ${this.ownerName || "Unknown"}`;
    }

    if (this.isRecovered()) {
      return `RECOVERED - ${this.licensePlate}\n${this.vehicleType.toUpperCase()}\nRecovered: ${this.recoveredDate?.toLocaleDateString()}`;
    }

    return `${this.licensePlate}\nOwner: ${this.ownerName || "Unknown"}\nType: ${this.vehicleType.toUpperCase()}\nStatus: CLEAN`;
  }

  /**
   * Get detailed description
   */
  getDetailedDescription(): string {
    const parts: string[] = [];

    if (this.year) parts.push(this.year.toString());
    if (this.make) parts.push(this.make);
    if (this.model) parts.push(this.model);
    if (this.color) parts.push(`(${this.color})`);

    return parts.length > 0
      ? parts.join(" ")
      : `${this.vehicleType} - No details available`;
  }

  /**
   * Validate license plate format
   * Note: This is basic validation - implement country-specific regex as needed
   */
  static isValidLicensePlate(plate: string): boolean {
    // Remove spaces, hyphens, and other delimiters, convert to uppercase
    const normalized = plate.toUpperCase().replace(/[\s\-]+/g, "");

    // Basic validation: 3-12 alphanumeric characters
    // Countries can override with specific formats (e.g., ABC-1234, ABC 123, etc.)
    const basicPattern = /^[A-Z0-9]{3,12}$/;

    return basicPattern.test(normalized);
  }

  /**
   * Normalize license plate for storage
   * Removes spaces, hyphens, and other delimiters, converts to uppercase
   */
  static normalizeLicensePlate(plate: string): string {
    return plate.toUpperCase().replace(/[\s\-]+/g, "");
  }

  /**
   * Validate vehicle data
   */
  static validate(data: {
    licensePlate: string;
    vehicleType: string;
    year?: number | null;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // License plate validation
    if (!data.licensePlate || data.licensePlate.trim().length === 0) {
      errors.push("License plate is required");
    } else if (!Vehicle.isValidLicensePlate(data.licensePlate)) {
      errors.push(
        "Invalid license plate format (3-12 alphanumeric characters required)"
      );
    }

    // Vehicle type validation
    const validTypes: VehicleType[] = [
      "car",
      "truck",
      "motorcycle",
      "bus",
      "van",
      "bicycle",
      "tricycle",
      "other",
    ];
    if (!validTypes.includes(data.vehicleType as VehicleType)) {
      errors.push("Invalid vehicle type");
    }

    // Year validation
    if (data.year !== null && data.year !== undefined) {
      const currentYear = new Date().getFullYear();
      if (data.year < 1900 || data.year > currentYear + 1) {
        errors.push(`Year must be between 1900 and ${currentYear + 1}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if vehicle can be marked as stolen
   */
  canMarkAsStolen(): boolean {
    return this.status === "active";
  }

  /**
   * Check if vehicle can be marked as recovered
   */
  canMarkAsRecovered(): boolean {
    return this.status === "stolen" && !this.recoveredDate;
  }

  /**
   * Check if vehicle can be impounded
   */
  canImpound(): boolean {
    return this.status === "active" || this.status === "stolen";
  }

  /**
   * Export to JSON for API responses
   */
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      licensePlate: this.licensePlate,
      ownerNIN: this.ownerNIN,
      ownerName: this.ownerName,
      vehicleType: this.vehicleType,
      make: this.make,
      model: this.model,
      color: this.color,
      year: this.year,
      status: this.status,
      stolenDate: this.stolenDate?.toISOString(),
      stolenReportedBy: this.stolenReportedBy,
      recoveredDate: this.recoveredDate?.toISOString(),
      notes: this.notes,
      stationId: this.stationId,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      // Computed fields
      isStolen: this.isStolen(),
      isRecovered: this.isRecovered(),
      isImpounded: this.isImpounded(),
      stolenDuration: this.getStolenDuration(),
      age: this.getAge(),
      detailedDescription: this.getDetailedDescription(),
    };
  }
}

/**
 * Evidence Domain Entity
 *
 * Represents physical or digital evidence in the criminal records system
 * Includes business logic for chain of custody, QR codes, and file integrity
 *
 * Pan-African Design:
 * - QR code based tracking for low-tech environments
 * - Offline-first evidence logging
 * - Chain of custody for legal compliance
 * - S3-compatible storage for flexibility (MinIO, AWS, etc.)
 */

/**
 * Evidence Types
 */
export type EvidenceType =
  | "physical" // Physical objects (weapons, drugs, etc.)
  | "document" // Paper documents
  | "photo" // Photographs
  | "video" // Video recordings
  | "audio" // Audio recordings
  | "digital" // Digital files (USB drives, hard drives, etc.)
  | "biological" // Biological samples (blood, DNA, etc.)
  | "other";

/**
 * Evidence Status
 */
export type EvidenceStatus =
  | "collected" // Just collected from scene
  | "stored" // In evidence storage
  | "analyzed" // Being analyzed
  | "court" // Presented in court
  | "returned" // Returned to owner
  | "destroyed"; // Destroyed per policy

/**
 * Chain of Custody Event
 */
export interface CustodyEvent {
  officerId: string;
  officerName: string;
  officerBadge: string;
  action: "collected" | "transferred" | "accessed" | "returned" | "destroyed";
  timestamp: Date;
  location: string;
  notes?: string;
  signature?: string; // Digital signature hash
}

/**
 * Evidence Entity
 *
 * Core domain entity for managing evidence with chain of custody
 */
export class Evidence {
  constructor(
    public readonly id: string,
    public readonly qrCode: string, // Unique QR code for physical tracking
    public readonly caseId: string,
    public readonly type: EvidenceType,
    public readonly description: string,
    public readonly status: EvidenceStatus,
    public readonly collectedDate: Date,
    public readonly collectedLocation: string,
    public readonly collectedBy: string, // Officer ID who collected
    public readonly fileUrl: string | null, // S3 URL for digital evidence
    public readonly fileKey: string | null, // S3 key for file operations (delete, presigned URLs)
    public readonly fileName: string | null,
    public readonly fileSize: number | null, // In bytes
    public readonly fileMimeType: string | null,
    public readonly fileHash: string | null, // SHA-256 for integrity verification
    public readonly storageLocation: string | null, // Physical storage location
    public readonly chainOfCustody: CustodyEvent[], // Immutable custody log
    public readonly tags: string[], // Searchable tags
    public readonly notes: string | null,
    public readonly isSealed: boolean, // Tamper-evident seal
    public readonly sealedAt: Date | null,
    public readonly sealedBy: string | null,
    public readonly stationId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Get the current custodian (last person to handle evidence)
   */
  getCurrentCustodian(): CustodyEvent | null {
    if (this.chainOfCustody.length === 0) {
      return null;
    }
    return this.chainOfCustody[this.chainOfCustody.length - 1];
  }

  /**
   * Get number of custody transfers
   */
  getCustodyTransferCount(): number {
    return this.chainOfCustody.filter((e) => e.action === "transferred").length;
  }

  /**
   * Get all officers who have handled this evidence
   */
  getHandlingOfficers(): { officerId: string; officerName: string; officerBadge: string }[] {
    const officers = new Map();
    this.chainOfCustody.forEach((event) => {
      if (!officers.has(event.officerId)) {
        officers.set(event.officerId, {
          officerId: event.officerId,
          officerName: event.officerName,
          officerBadge: event.officerBadge,
        });
      }
    });
    return Array.from(officers.values());
  }

  /**
   * Check if evidence has been tampered with (based on seal and file hash)
   */
  isPotentiallyTampered(): boolean {
    // If sealed but seal is broken
    if (this.isSealed && this.status === "stored") {
      // In real implementation, would check physical seal status
      return false;
    }

    // If file hash doesn't match (would need to recalculate from S3)
    // This is a placeholder - actual implementation would verify against S3 file
    return false;
  }

  /**
   * Check if evidence is digital (has file)
   */
  isDigital(): boolean {
    return this.fileUrl !== null && this.fileName !== null;
  }

  /**
   * Check if evidence is physical only
   */
  isPhysicalOnly(): boolean {
    return !this.isDigital();
  }

  /**
   * Get human-readable file size
   */
  getHumanReadableFileSize(): string | null {
    if (!this.fileSize) return null;

    const units = ["B", "KB", "MB", "GB", "TB"];
    let size = this.fileSize;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Get evidence age in days
   */
  getAgeInDays(): number {
    const now = new Date();
    const collected = new Date(this.collectedDate);
    const diffTime = Math.abs(now.getTime() - collected.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if evidence is stale (old and not in court/destroyed)
   */
  isStale(maxDays: number = 365): boolean {
    if (this.status === "court" || this.status === "destroyed" || this.status === "returned") {
      return false;
    }
    return this.getAgeInDays() > maxDays;
  }

  /**
   * Check if evidence can be destroyed (legal retention period passed)
   */
  canBeDestroyed(retentionDays: number = 730): boolean {
    // Can only destroy if case is closed and retention period passed
    if (this.status === "court") {
      return false; // Cannot destroy evidence in court
    }
    return this.getAgeInDays() > retentionDays;
  }

  /**
   * Validate status transition
   */
  canTransitionTo(newStatus: EvidenceStatus): { allowed: boolean; reason?: string } {
    // Cannot change status if destroyed
    if (this.status === "destroyed") {
      return { allowed: false, reason: "Cannot change status of destroyed evidence" };
    }

    // Cannot go back to collected once stored
    if (newStatus === "collected" && this.status !== "collected") {
      return { allowed: false, reason: "Cannot revert to collected status" };
    }

    // Valid workflows
    const validTransitions: Record<EvidenceStatus, EvidenceStatus[]> = {
      collected: ["stored", "court"],
      stored: ["analyzed", "court", "returned", "destroyed"],
      analyzed: ["stored", "court"],
      court: ["stored", "returned"],
      returned: ["destroyed"],
      destroyed: [],
    };

    const allowed = validTransitions[this.status]?.includes(newStatus) || false;

    if (!allowed) {
      return {
        allowed: false,
        reason: `Cannot transition from ${this.status} to ${newStatus}`,
      };
    }

    return { allowed: true };
  }

  /**
   * Check if evidence requires special handling
   */
  requiresSpecialHandling(): boolean {
    // Biological and digital evidence require special handling
    return this.type === "biological" || this.type === "digital";
  }

  /**
   * Get custody chain as formatted text for reports
   */
  getCustodyChainText(): string {
    return this.chainOfCustody
      .map((event, index) => {
        const timestamp = new Date(event.timestamp).toLocaleString();
        return `${index + 1}. ${event.action.toUpperCase()} by ${event.officerName} (${event.officerBadge}) at ${event.location} on ${timestamp}${event.notes ? ` - ${event.notes}` : ""}`;
      })
      .join("\n");
  }

  /**
   * Check if evidence is ready for court presentation
   */
  isReadyForCourt(): { ready: boolean; issues: string[] } {
    const issues: string[] = [];

    // Must have complete chain of custody
    if (this.chainOfCustody.length === 0) {
      issues.push("No chain of custody recorded");
    }

    // Must be sealed for integrity
    if (!this.isSealed) {
      issues.push("Evidence not sealed");
    }

    // Must have description
    if (!this.description || this.description.length < 10) {
      issues.push("Insufficient description");
    }

    // Digital evidence must have file hash
    if (this.isDigital() && !this.fileHash) {
      issues.push("Digital evidence missing integrity hash");
    }

    // Must be stored or analyzed
    if (this.status === "collected") {
      issues.push("Evidence not yet processed/stored");
    }

    return {
      ready: issues.length === 0,
      issues,
    };
  }

  /**
   * Verify file integrity (would compare with actual file hash from S3)
   */
  verifyIntegrity(currentFileHash: string): boolean {
    if (!this.fileHash) {
      return true; // No hash to verify against
    }
    return this.fileHash === currentFileHash;
  }

  /**
   * Generate QR code data string
   */
  getQRCodeData(): string {
    return `CRMS-EVIDENCE:${this.qrCode}:${this.caseId}:${this.id}`;
  }

  /**
   * Get evidence summary for display
   */
  getSummary(): string {
    const custodian = this.getCurrentCustodian();
    return `${this.type.toUpperCase()} evidence (${this.qrCode}) - ${this.description.substring(0, 50)}${this.description.length > 50 ? "..." : ""} | Status: ${this.status} | Current custodian: ${custodian?.officerName || "Unknown"}`;
  }

  /**
   * Check if evidence is critical (high-value or biological)
   */
  isCritical(): boolean {
    return (
      this.type === "biological" ||
      this.tags.includes("critical") ||
      this.tags.includes("high-value") ||
      this.tags.includes("weapon")
    );
  }
}

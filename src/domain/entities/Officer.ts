/**
 * Officer Domain Entity
 *
 * Pure business object with domain logic for police officers.
 * No database or framework dependencies.
 *
 * Pan-African Design: Country-agnostic - works for any African country
 */
export class Officer {
  constructor(
    public readonly id: string,
    public readonly badge: string,
    public readonly name: string,
    public readonly email: string | null,
    public readonly phone: string | null,
    public readonly roleId: string,
    public readonly stationId: string,
    public readonly active: boolean,
    public readonly lastLogin: Date | null,
    public readonly pinChangedAt: Date,
    public readonly failedAttempts: number,
    public readonly lockedUntil: Date | null,
    public readonly mfaEnabled: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Check if account is currently locked
   */
  isLocked(): boolean {
    return this.lockedUntil !== null && this.lockedUntil > new Date();
  }

  /**
   * Check if PIN has expired (default: 90 days)
   * Configurable per country's security policies
   */
  isPinExpired(maxAgeDays: number = 90): boolean {
    const daysSinceChange = Math.floor(
      (Date.now() - this.pinChangedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceChange > maxAgeDays;
  }

  /**
   * Domain logic: Check if officer can login
   * Returns allowed status and reason if not allowed
   */
  canLogin(): { allowed: boolean; reason?: string } {
    if (!this.active) {
      return { allowed: false, reason: "Account is deactivated" };
    }
    if (this.isLocked()) {
      return { allowed: false, reason: "Account is locked. Try again later." };
    }
    if (this.isPinExpired()) {
      return { allowed: false, reason: "PIN has expired. Please reset your PIN." };
    }
    return { allowed: true };
  }

  /**
   * Check if MFA should be required for this officer
   */
  shouldRequireMFA(): boolean {
    return this.mfaEnabled;
  }

  /**
   * Get days since last login
   */
  getDaysSinceLastLogin(): number | null {
    if (!this.lastLogin) return null;
    return Math.floor((Date.now() - this.lastLogin.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if this is a new account (never logged in)
   */
  isNewAccount(): boolean {
    return this.lastLogin === null;
  }
}

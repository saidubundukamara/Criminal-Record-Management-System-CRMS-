/**
 * Role Domain Entity
 *
 * Represents a role in the RBAC system.
 * Pan-African Design: Configurable role levels can adapt to different police hierarchies
 *
 * Role Levels:
 * 1 = SuperAdmin (full system access)
 * 2 = Admin (regional/national administration)
 * 3 = StationCommander (station-level oversight)
 * 4 = Officer (operational police officer)
 * 5 = EvidenceClerk (evidence management specialist)
 * 6 = Viewer (read-only access - prosecutors, etc.)
 */
export class Role {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly level: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Check if this role is an administrative role
   */
  isAdmin(): boolean {
    return this.level <= 2; // SuperAdmin or Admin
  }

  /**
   * Check if this role can manage officers
   */
  canManageOfficers(): boolean {
    return this.level <= 2; // SuperAdmin or Admin only
  }

  /**
   * Check if this role can manage stations
   */
  canManageStations(): boolean {
    return this.level <= 2; // SuperAdmin or Admin only
  }

  /**
   * Check if this role has higher authority than another role
   */
  hasHigherAuthorityThan(otherRole: Role): boolean {
    return this.level < otherRole.level; // Lower level number = higher authority
  }

  /**
   * Get display name for the role
   */
  getDisplayName(): string {
    return this.name;
  }
}

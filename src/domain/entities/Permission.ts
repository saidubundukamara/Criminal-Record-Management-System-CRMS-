/**
 * Permission Domain Entity
 *
 * Represents a granular permission in the RBAC system.
 * Pan-African Design: Permission scopes can adapt to different organizational structures
 *
 * Resources: cases, persons, evidence, officers, stations, alerts, bgcheck, reports
 * Actions: create, read, update, delete, export
 * Scopes: own, station, region, national
 */
export type PermissionResource =
  | "cases"
  | "persons"
  | "evidence"
  | "officers"
  | "stations"
  | "alerts"
  | "bgcheck"
  | "reports";

export type PermissionAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "export";

export type PermissionScope =
  | "own"      // User's own resources
  | "station"  // Station-level resources
  | "region"   // Regional resources (adaptable: province, state, district, etc.)
  | "national"; // National/country-wide resources

export class Permission {
  constructor(
    public readonly id: string,
    public readonly resource: PermissionResource,
    public readonly action: PermissionAction,
    public readonly scope: PermissionScope
  ) {}

  /**
   * Check if this permission allows the given action on the given resource
   */
  allows(resource: PermissionResource, action: PermissionAction): boolean {
    return this.resource === resource && this.action === action;
  }

  /**
   * Check if this permission's scope is sufficient for the required scope
   * Scope hierarchy: own < station < region < national
   */
  hasSufficientScope(requiredScope: PermissionScope): boolean {
    const scopeHierarchy: Record<PermissionScope, number> = {
      own: 1,
      station: 2,
      region: 3,
      national: 4,
    };

    return scopeHierarchy[this.scope] >= scopeHierarchy[requiredScope];
  }

  /**
   * Get a human-readable description of this permission
   */
  getDescription(): string {
    return `${this.action} ${this.resource} (${this.scope} scope)`;
  }

  /**
   * Check if this is a read-only permission
   */
  isReadOnly(): boolean {
    return this.action === "read";
  }

  /**
   * Check if this is a write permission
   */
  isWritePermission(): boolean {
    return ["create", "update", "delete"].includes(this.action);
  }
}

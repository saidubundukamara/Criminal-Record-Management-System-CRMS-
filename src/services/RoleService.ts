/**
 * Role Service
 *
 * Handles all role and permission management business logic:
 * - Role creation, update, deletion
 * - Permission assignment and removal
 * - Role cloning
 * - Permission templates for common role types
 *
 * Pan-African Design: Flexible role system adaptable to different police hierarchies
 */
import {
  IRoleRepository,
  CreateRoleDto,
  UpdateRoleDto,
} from "@/src/domain/interfaces/repositories/IRoleRepository";
import {
  IPermissionRepository,
  CreatePermissionDto,
} from "@/src/domain/interfaces/repositories/IPermissionRepository";
import { IAuditLogRepository } from "@/src/domain/interfaces/repositories/IAuditLogRepository";
import { IOfficerRepository } from "@/src/domain/interfaces/repositories/IOfficerRepository";
import { Role } from "@/src/domain/entities/Role";
import {
  Permission,
  PermissionResource,
  PermissionAction,
  PermissionScope,
} from "@/src/domain/entities/Permission";
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from "@/src/lib/errors";

export interface CreateRoleInput {
  name: string;
  description?: string;
  level: number; // 1 (SuperAdmin) to 6 (Viewer)
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  level?: number;
}

export interface AssignPermissionsInput {
  permissionIds: string[];
}

export interface RemovePermissionsInput {
  permissionIds: string[];
}

export interface CloneRoleInput {
  newName: string;
  newDescription?: string;
  newLevel: number;
}

/**
 * Role with permissions (for detailed views)
 */
export interface RoleWithPermissions {
  role: Role;
  permissions: Permission[];
}

/**
 * Permission Template Definition
 */
export interface PermissionTemplate {
  name: string;
  description: string;
  level: number; // Suggested role level
  permissions: Array<{
    resource: PermissionResource;
    action: PermissionAction;
    scope: PermissionScope;
  }>;
}

export class RoleService {
  // System role levels that cannot be deleted
  private readonly PROTECTED_LEVELS = [1, 2, 3, 4, 5, 6];

  constructor(
    private readonly roleRepo: IRoleRepository,
    private readonly permissionRepo: IPermissionRepository,
    private readonly officerRepo: IOfficerRepository,
    private readonly auditRepo: IAuditLogRepository
  ) {}

  /**
   * Create a new role
   * Validates input and ensures unique level
   */
  async createRole(
    data: CreateRoleInput,
    createdBy: string,
    ipAddress?: string
  ): Promise<Role> {
    // Validation
    this.validateRoleInput(data);

    // Check name uniqueness
    const roles = await this.roleRepo.findAll();
    const existingRole = roles.find(
      (r) => r.name.toLowerCase() === data.name.toLowerCase()
    );
    if (existingRole) {
      throw new ValidationError(`Role with name "${data.name}" already exists`);
    }

    // Check level uniqueness
    const roleWithLevel = roles.find((r) => r.level === data.level);
    if (roleWithLevel) {
      throw new ValidationError(
        `Role level ${data.level} is already assigned to "${roleWithLevel.name}"`
      );
    }

    // Create role
    const roleData: CreateRoleDto = {
      name: data.name.trim(),
      description: data.description?.trim(),
      level: data.level,
    };

    const newRole = await this.roleRepo.create(roleData);

    // Audit log
    await this.auditRepo.create({
      entityType: "role",
      entityId: newRole.id,
      officerId: createdBy,
      action: "create",
      success: true,
      details: {
        name: newRole.name,
        level: newRole.level,
      },
      ipAddress,
    });

    return newRole;
  }

  /**
   * Get role by ID with permissions
   */
  async getRole(id: string): Promise<RoleWithPermissions> {
    const result = await this.roleRepo.findByIdWithPermissions(id);

    if (!result) {
      throw new NotFoundError(`Role with ID ${id} not found`);
    }

    return result;
  }

  /**
   * List all roles
   */
  async listRoles(): Promise<Role[]> {
    return await this.roleRepo.findAll();
  }

  /**
   * Update role
   * Validates input and logs changes
   */
  async updateRole(
    id: string,
    data: UpdateRoleInput,
    updatedBy: string,
    ipAddress?: string
  ): Promise<Role> {
    // Check role exists
    const { role: existingRole } = await this.getRole(id);

    // Check name uniqueness if name is being changed
    if (data.name && data.name.toLowerCase() !== existingRole.name.toLowerCase()) {
      const roles = await this.roleRepo.findAll();
      const roleWithName = roles.find(
        (r) => r.name.toLowerCase() === data.name!.toLowerCase()
      );
      if (roleWithName) {
        throw new ValidationError(`Role with name "${data.name}" already exists`);
      }
    }

    // Check level uniqueness if level is being changed
    if (data.level && data.level !== existingRole.level) {
      const roles = await this.roleRepo.findAll();
      const roleWithLevel = roles.find((r) => r.level === data.level);
      if (roleWithLevel) {
        throw new ValidationError(
          `Role level ${data.level} is already assigned to "${roleWithLevel.name}"`
        );
      }

      // Validate level range
      if (data.level < 1 || data.level > 6) {
        throw new ValidationError("Role level must be between 1 and 6");
      }
    }

    // Prepare update data
    const updateData: UpdateRoleDto = {
      ...data,
      name: data.name?.trim(),
      description: data.description?.trim(),
    };

    // Update role
    const updatedRole = await this.roleRepo.update(id, updateData);

    // Audit log
    await this.auditRepo.create({
      entityType: "role",
      entityId: id,
      officerId: updatedBy,
      action: "update",
      success: true,
      details: {
        name: existingRole.name,
        changes: data,
      },
      ipAddress,
    });

    return updatedRole;
  }

  /**
   * Delete role
   * Cannot delete if officers are assigned to it
   */
  async deleteRole(
    id: string,
    deletedBy: string,
    ipAddress?: string
  ): Promise<void> {
    // Check role exists
    const { role } = await this.getRole(id);

    // Check if any officers are assigned to this role
    const officers = await this.officerRepo.findAll({ roleId: id });
    if (officers.length > 0) {
      throw new ForbiddenError(
        `Cannot delete role "${role.name}". ${officers.length} officer(s) are assigned to this role.`
      );
    }

    // Delete role
    await this.roleRepo.delete(id);

    // Audit log
    await this.auditRepo.create({
      entityType: "role",
      entityId: id,
      officerId: deletedBy,
      action: "delete",
      success: true,
      details: {
        name: role.name,
        level: role.level,
      },
      ipAddress,
    });
  }

  /**
   * Assign permissions to role
   */
  async assignPermissions(
    roleId: string,
    data: AssignPermissionsInput,
    assignedBy: string,
    ipAddress?: string
  ): Promise<RoleWithPermissions> {
    const { role } = await this.getRole(roleId);

    // Validate all permissions exist
    for (const permissionId of data.permissionIds) {
      const permission = await this.permissionRepo.findById(permissionId);
      if (!permission) {
        throw new NotFoundError(`Permission with ID ${permissionId} not found`);
      }
    }

    // Assign permissions
    await this.roleRepo.addPermissions(roleId, data.permissionIds);

    // Audit log
    await this.auditRepo.create({
      entityType: "role",
      entityId: roleId,
      officerId: assignedBy,
      action: "assign_permissions",
      success: true,
      details: {
        roleName: role.name,
        permissionsCount: data.permissionIds.length,
        permissionIds: data.permissionIds,
      },
      ipAddress,
    });

    return await this.getRole(roleId);
  }

  /**
   * Remove permissions from role
   */
  async removePermissions(
    roleId: string,
    data: RemovePermissionsInput,
    removedBy: string,
    ipAddress?: string
  ): Promise<RoleWithPermissions> {
    const { role } = await this.getRole(roleId);

    // Remove permissions
    await this.roleRepo.removePermissions(roleId, data.permissionIds);

    // Audit log
    await this.auditRepo.create({
      entityType: "role",
      entityId: roleId,
      officerId: removedBy,
      action: "remove_permissions",
      success: true,
      details: {
        roleName: role.name,
        permissionsCount: data.permissionIds.length,
        permissionIds: data.permissionIds,
      },
      ipAddress,
    });

    return await this.getRole(roleId);
  }

  /**
   * Replace all permissions for a role
   */
  async replacePermissions(
    roleId: string,
    permissionIds: string[],
    updatedBy: string,
    ipAddress?: string
  ): Promise<RoleWithPermissions> {
    const { role, permissions: currentPermissions } = await this.getRole(roleId);

    // Validate all permissions exist
    for (const permissionId of permissionIds) {
      const permission = await this.permissionRepo.findById(permissionId);
      if (!permission) {
        throw new NotFoundError(`Permission with ID ${permissionId} not found`);
      }
    }

    // Get current permissions
    const currentPermissionIds = currentPermissions.map((p) => p.id);

    // Remove all current permissions
    if (currentPermissionIds.length > 0) {
      await this.roleRepo.removePermissions(roleId, currentPermissionIds);
    }

    // Add new permissions
    if (permissionIds.length > 0) {
      await this.roleRepo.addPermissions(roleId, permissionIds);
    }

    // Audit log
    await this.auditRepo.create({
      entityType: "role",
      entityId: roleId,
      officerId: updatedBy,
      action: "replace_permissions",
      success: true,
      details: {
        roleName: role.name,
        previousCount: currentPermissionIds.length,
        newCount: permissionIds.length,
      },
      ipAddress,
    });

    return await this.getRole(roleId);
  }

  /**
   * Clone an existing role with a new name and level
   */
  async cloneRole(
    sourceRoleId: string,
    data: CloneRoleInput,
    clonedBy: string,
    ipAddress?: string
  ): Promise<RoleWithPermissions> {
    // Get source role with permissions
    const { role: sourceRole, permissions: sourcePermissions } = await this.getRole(sourceRoleId);

    // Create new role
    const newRole = await this.createRole(
      {
        name: data.newName,
        description: data.newDescription || `Cloned from ${sourceRole.name}`,
        level: data.newLevel,
      },
      clonedBy,
      ipAddress
    );

    // Copy permissions if source role has any
    if (sourcePermissions.length > 0) {
      const permissionIds = sourcePermissions.map((p) => p.id);
      await this.roleRepo.addPermissions(newRole.id, permissionIds);
    }

    // Audit log for cloning
    await this.auditRepo.create({
      entityType: "role",
      entityId: newRole.id,
      officerId: clonedBy,
      action: "clone",
      success: true,
      details: {
        sourceRoleId: sourceRole.id,
        sourceRoleName: sourceRole.name,
        newRoleName: newRole.name,
        permissionsCopied: sourcePermissions.length,
      },
      ipAddress,
    });

    return await this.getRole(newRole.id);
  }

  /**
   * Create role from a permission template
   */
  async createFromTemplate(
    templateName: string,
    roleName: string,
    createdBy: string,
    ipAddress?: string
  ): Promise<RoleWithPermissions> {
    const templates = this.getPermissionTemplates();
    const template = templates.find((t) => t.name === templateName);

    if (!template) {
      throw new NotFoundError(`Template "${templateName}" not found`);
    }

    // Create role
    const role = await this.createRole(
      {
        name: roleName,
        description: template.description,
        level: template.level,
      },
      createdBy,
      ipAddress
    );

    // Create or find permissions and assign to role
    const permissionIds: string[] = [];

    for (const permDef of template.permissions) {
      // Try to find existing permission
      let permission = await this.permissionRepo.findByAttributes(
        permDef.resource,
        permDef.action,
        permDef.scope
      );

      // Create permission if it doesn't exist
      if (!permission) {
        const permData: CreatePermissionDto = {
          resource: permDef.resource,
          action: permDef.action,
          scope: permDef.scope,
        };
        permission = await this.permissionRepo.create(permData);
      }

      permissionIds.push(permission.id);
    }

    // Assign all permissions to role
    if (permissionIds.length > 0) {
      await this.roleRepo.addPermissions(role.id, permissionIds);
    }

    // Audit log
    await this.auditRepo.create({
      entityType: "role",
      entityId: role.id,
      officerId: createdBy,
      action: "create_from_template",
      success: true,
      details: {
        templateName,
        roleName,
        permissionsAssigned: permissionIds.length,
      },
      ipAddress,
    });

    return await this.getRole(role.id);
  }

  /**
   * Get predefined permission templates
   */
  getPermissionTemplates(): PermissionTemplate[] {
    return [
      {
        name: "Standard Officer",
        description: "Basic field officer with station-level case management",
        level: 4,
        permissions: [
          { resource: "cases", action: "read", scope: "station" },
          { resource: "cases", action: "create", scope: "station" },
          { resource: "cases", action: "update", scope: "station" },
          { resource: "persons", action: "read", scope: "station" },
          { resource: "persons", action: "create", scope: "station" },
          { resource: "persons", action: "update", scope: "station" },
          { resource: "evidence", action: "read", scope: "station" },
          { resource: "bgcheck", action: "read", scope: "station" },
        ],
      },
      {
        name: "Evidence Manager",
        description: "Officer specialized in evidence handling and chain of custody",
        level: 5,
        permissions: [
          { resource: "evidence", action: "read", scope: "station" },
          { resource: "evidence", action: "create", scope: "station" },
          { resource: "evidence", action: "update", scope: "station" },
          { resource: "evidence", action: "delete", scope: "station" },
          { resource: "cases", action: "read", scope: "station" },
          { resource: "bgcheck", action: "read", scope: "station" },
        ],
      },
      {
        name: "Station Commander",
        description: "Station-level leadership with officer and report management",
        level: 3,
        permissions: [
          { resource: "cases", action: "read", scope: "station" },
          { resource: "cases", action: "create", scope: "station" },
          { resource: "cases", action: "update", scope: "station" },
          { resource: "cases", action: "delete", scope: "station" },
          { resource: "persons", action: "read", scope: "station" },
          { resource: "persons", action: "create", scope: "station" },
          { resource: "persons", action: "update", scope: "station" },
          { resource: "persons", action: "delete", scope: "station" },
          { resource: "evidence", action: "read", scope: "station" },
          { resource: "evidence", action: "create", scope: "station" },
          { resource: "evidence", action: "update", scope: "station" },
          { resource: "officers", action: "read", scope: "station" },
          { resource: "reports", action: "read", scope: "station" },
          { resource: "reports", action: "export", scope: "station" },
          { resource: "bgcheck", action: "read", scope: "station" },
          { resource: "bgcheck", action: "create", scope: "station" },
        ],
      },
      {
        name: "Regional Commander",
        description: "Regional-level oversight with broader access",
        level: 2,
        permissions: [
          { resource: "cases", action: "read", scope: "region" },
          { resource: "cases", action: "create", scope: "region" },
          { resource: "cases", action: "update", scope: "region" },
          { resource: "cases", action: "delete", scope: "region" },
          { resource: "persons", action: "read", scope: "region" },
          { resource: "persons", action: "create", scope: "region" },
          { resource: "persons", action: "update", scope: "region" },
          { resource: "persons", action: "delete", scope: "region" },
          { resource: "evidence", action: "read", scope: "region" },
          { resource: "evidence", action: "create", scope: "region" },
          { resource: "evidence", action: "update", scope: "region" },
          { resource: "officers", action: "read", scope: "region" },
          { resource: "officers", action: "update", scope: "region" },
          { resource: "reports", action: "read", scope: "region" },
          { resource: "reports", action: "export", scope: "region" },
          { resource: "bgcheck", action: "read", scope: "region" },
          { resource: "bgcheck", action: "create", scope: "region" },
          { resource: "alerts", action: "read", scope: "region" },
          { resource: "alerts", action: "create", scope: "region" },
        ],
      },
      {
        name: "Investigator",
        description: "Specialized investigator with case and person management focus",
        level: 4,
        permissions: [
          { resource: "cases", action: "read", scope: "station" },
          { resource: "cases", action: "update", scope: "station" },
          { resource: "persons", action: "read", scope: "station" },
          { resource: "persons", action: "update", scope: "station" },
          { resource: "evidence", action: "read", scope: "station" },
          { resource: "reports", action: "read", scope: "station" },
          { resource: "bgcheck", action: "read", scope: "station" },
          { resource: "bgcheck", action: "create", scope: "station" },
        ],
      },
    ];
  }

  /**
   * Get role statistics
   */
  async getStats(): Promise<{
    total: number;
    byLevel: Record<number, { count: number; name: string }>;
  }> {
    const roles = await this.roleRepo.findAll();

    const stats = {
      total: roles.length,
      byLevel: {} as Record<number, { count: number; name: string }>,
    };

    // Count by level
    roles.forEach((role) => {
      if (!stats.byLevel[role.level]) {
        stats.byLevel[role.level] = { count: 0, name: role.name };
      }
      stats.byLevel[role.level].count++;
    });

    return stats;
  }

  /**
   * Validate role input
   */
  private validateRoleInput(data: CreateRoleInput): void {
    if (!data.name || data.name.trim().length < 2) {
      throw new ValidationError("Role name must be at least 2 characters");
    }

    if (data.level < 1 || data.level > 6) {
      throw new ValidationError("Role level must be between 1 (SuperAdmin) and 6 (Viewer)");
    }
  }
}

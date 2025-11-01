/**
 * Roles List Page
 *
 * Admin page for managing all roles and permissions
 * Pan-African Design: Clear role hierarchy management
 */
import { Suspense } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canManageRoles } from "@/lib/permissions";
import { container } from "@/src/di/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleList } from "@/components/roles";
import { StatsCard, EmptyState } from "@/components/admin";
import { Plus, Shield, Users } from "lucide-react";

async function getRolesData() {
  const roles = await container.roleRepository.findAll();

  // Get permission count and officer count for each role
  const rolesWithCounts = await Promise.all(
    roles.map(async (role) => {
      const roleWithPerms = await container.roleRepository.findByIdWithPermissions(role.id);
      const officers = await container.officerRepository.findAll({
        roleId: role.id,
      });

      return {
        id: role.id,
        name: role.name,
        description: role.description,
        level: role.level,
        permissionCount: roleWithPerms?.permissions.length || 0,
        officerCount: officers.length,
      };
    })
  );

  return { roles: rolesWithCounts };
}

export default async function RolesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (!canManageRoles(session)) {
    redirect("/dashboard");
  }

  const { roles } = await getRolesData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-muted-foreground">
            Manage officer roles and their access permissions
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/admin/roles/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Role
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <StatsCard
          title="Total Roles"
          value={roles.length}
          icon={Shield}
        />
        <StatsCard
          title="Total Officers Assigned"
          value={roles.reduce((sum, role) => sum + (role.officerCount || 0), 0)}
          icon={Users}
        />
      </div>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Roles</CardTitle>
          <CardDescription>
            View and manage all roles in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="No roles yet"
              description="Get started by creating your first role with permissions"
              actionLabel="Add Role"
              onAction={() => {}}
            />
          ) : (
            <RoleList roles={roles} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

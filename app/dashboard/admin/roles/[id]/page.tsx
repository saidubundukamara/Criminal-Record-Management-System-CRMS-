/**
 * Role Detail Page
 *
 * View role details and perform actions
 * Pan-African Design: Clear role information display
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageRoles } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit,
  Shield,
  Users,
  Key,
  Trash2,
  Copy,
} from "lucide-react";
import { format } from "date-fns";

interface RoleDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getRoleData(id: string) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/roles/${id}`, {
      cache: 'no-store',
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching role:", error);
    return null;
  }
}

export default async function RoleDetailPage({ params }: RoleDetailPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (!canManageRoles(session)) {
    redirect("/dashboard");
  }

  const data = await getRoleData(id);
  if (!data || !data.role) {
    notFound();
  }

  const { role, permissions, officerCount } = data;

  // Group permissions by resource
  const groupedPermissions = (permissions || []).reduce((acc: Record<string, any[]>, permission: any) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = [];
    }
    acc[permission.resource].push(permission);
    return acc;
  }, {});

  const resourceLabels: Record<string, string> = {
    cases: "Cases",
    persons: "Persons",
    evidence: "Evidence",
    officers: "Officers",
    stations: "Stations",
    alerts: "Alerts",
    bgcheck: "Background Checks",
    reports: "Reports",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/admin/roles">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{role.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="font-mono">
                Level {role.level}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/admin/roles/${id}/permissions`}>
              <Key className="mr-2 h-4 w-4" />
              Manage Permissions
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/admin/roles/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Role
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Role Name</div>
              <div className="font-semibold">{role.name}</div>
            </div>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground">Description</div>
              <div className="text-sm">{role.description || "No description provided"}</div>
            </div>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Hierarchy Level
              </div>
              <div className="font-semibold">Level {role.level}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {role.level === 1 && "SuperAdmin - Full system access"}
                {role.level === 2 && "Admin - Regional/national administration"}
                {role.level === 3 && "Station Commander - Station-level oversight"}
                {role.level === 4 && "Officer - Operational police officer"}
                {role.level === 5 && "Evidence Clerk - Evidence management specialist"}
                {role.level === 6 && "Viewer - Read-only access"}
                {role.level > 6 && "Custom role level"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                Officers Assigned
              </div>
              <div className="text-2xl font-bold">{officerCount}</div>
            </div>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Key className="h-3 w-3" />
                Permissions Assigned
              </div>
              <div className="text-2xl font-bold">{permissions?.length || 0}</div>
            </div>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground">Created At</div>
              <div className="text-sm">{role.createdAt ? format(new Date(role.createdAt), "PPP") : "N/A"}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Assigned Permissions</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {permissions?.length || 0} {permissions?.length === 1 ? "permission" : "permissions"} assigned to this role
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/admin/roles/${id}/permissions`}>
                <Key className="mr-2 h-4 w-4" />
                Manage Permissions
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {permissions && permissions.length > 0 ? (
            <div className="space-y-4">
              {Object.entries(groupedPermissions).map(([resource, perms]: [string, any]) => (
                <div key={resource}>
                  <h4 className="text-sm font-medium mb-2">{resourceLabels[resource] || resource}</h4>
                  <div className="flex flex-wrap gap-2">
                    {perms.map((permission: any) => (
                      <Badge key={permission.id} variant="secondary" className="text-xs">
                        {permission.action} ({permission.scope})
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No permissions assigned yet</p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/api/roles/${id}/clone`}>
                <Copy className="mr-2 h-4 w-4" />
                Clone Role
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/admin/officers?role=${id}`}>
                <Users className="mr-2 h-4 w-4" />
                View Officers
              </Link>
            </Button>
            {officerCount === 0 && (
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Role
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

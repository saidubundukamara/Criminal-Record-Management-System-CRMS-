/**
 * Role Permissions Page
 *
 * Manage permissions for a role
 * Pan-African Design: Clear permission management interface
 */
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, use } from "react";
import { PermissionSelector, Permission } from "@/components/roles/permission-selector";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function RolePermissionsPage({ params }: PageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { id } = use(params);
  const [role, setRole] = useState<any>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch role with current permissions
        const roleResponse = await fetch(`/api/roles/${id}`);

        if (!roleResponse.ok) {
          if (roleResponse.status === 404) {
            setError("Role not found");
          } else {
            setError("Failed to load role data");
          }
          return;
        }

        const roleData = await roleResponse.json();
        setRole(roleData.role);

        // Set currently selected permission IDs
        const currentPermissionIds = (roleData.permissions || []).map((p: any) => p.id);
        setSelectedPermissionIds(currentPermissionIds);

        // For now, we'll use the permissions from the role data as "all permissions"
        // In a real implementation, you'd fetch all available permissions from an endpoint
        // For this demo, we'll fetch from the database via a direct call

        // Fetch all available permissions (we need to create this endpoint or use the container)
        // For now, let's assume we have the permissions from the role
        setAllPermissions(roleData.permissions || []);

      } catch (error) {
        console.error("Failed to load data:", error);
        setError("Failed to load permissions data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  const handleSave = async () => {
    try {
      setSaving(true);

      // Replace all permissions for the role
      const response = await fetch(`/api/roles/${id}/permissions`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          permissionIds: selectedPermissionIds,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update permissions");
      }

      toast({
        title: "Permissions updated",
        description: "Role permissions have been updated successfully.",
      });

      router.push(`/dashboard/admin/roles/${id}`);
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/admin/roles/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Role
            </Link>
          </Button>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/admin/roles">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Roles
            </Link>
          </Button>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-red-600">{error || "Role not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/admin/roles/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Role
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manage Permissions</h1>
            <p className="text-muted-foreground mt-1">
              {role.name} (Level {role.level})
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>Saving...</>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Summary</CardTitle>
          <CardDescription>
            Select the permissions this role should have
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Permissions Selected</div>
              <div className="text-2xl font-bold">{selectedPermissionIds.length}</div>
            </div>
            <div className="border-l pl-4">
              <div className="text-sm text-muted-foreground">Total Available</div>
              <div className="text-2xl font-bold">{allPermissions.length}</div>
            </div>
            <div className="border-l pl-4">
              <div className="text-sm text-muted-foreground">Hierarchy Level</div>
              <Badge variant="outline" className="text-lg font-bold mt-1">
                Level {role.level}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permission Selector */}
      {allPermissions.length > 0 ? (
        <PermissionSelector
          permissions={allPermissions}
          selectedIds={selectedPermissionIds}
          onChange={setSelectedPermissionIds}
        />
      ) : (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No permissions available. Please create permissions in the system first.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Permission Guidelines</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Permissions are organized by resource (Cases, Persons, Evidence, etc.)</li>
          <li>Each permission has an action (create, read, update, delete, export)</li>
          <li>Scope defines the reach (own, station, region, national)</li>
          <li>Lower hierarchy levels (1-3) typically have broader scopes</li>
          <li>Changes take effect immediately after saving</li>
        </ul>
      </div>

      {/* Save Button (bottom) */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.back()} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>Saving...</>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

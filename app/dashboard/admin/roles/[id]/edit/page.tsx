/**
 * Edit Role Page
 *
 * Form for editing an existing role record
 * Pan-African Design: Clear, accessible form for role management
 */
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, use } from "react";
import { RoleForm, RoleFormData } from "@/components/roles/role-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditRolePage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const [role, setRole] = useState<(RoleFormData & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch(`/api/roles/${id}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("Role not found");
          } else {
            setError("Failed to load role data");
          }
          return;
        }

        const data = await response.json();

        // Transform role data to match form expectations
        setRole({
          id: data.role.id,
          name: data.role.name,
          description: data.role.description || "",
          level: data.role.level,
        });
      } catch (error) {
        console.error("Failed to load data:", error);
        setError("Failed to load role data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  const handleSubmit = async (formData: RoleFormData) => {
    const response = await fetch(`/api/roles/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: formData.name,
        description: formData.description || undefined,
        level: formData.level,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update role");
    }

    return response.json();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
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
      <div className="max-w-4xl mx-auto space-y-6">
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/admin/roles/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Role
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Role</h1>
          <p className="text-gray-600 mt-2">
            Update the role details below
          </p>
        </div>

        <RoleForm
          role={role}
          onSubmit={handleSubmit}
          mode="edit"
        />
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Editing Guidelines</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>All changes will be tracked in the audit log</li>
          <li>Changing the hierarchy level may affect permissions</li>
          <li>Role name and description updates are immediate</li>
          <li>Use the Permissions page to manage role permissions</li>
        </ul>
      </div>

      {/* RBAC Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 mb-2">Role-Based Access Control</h3>
        <p className="text-sm text-yellow-800">
          This role is part of the RBAC system. Changes to hierarchy level affect
          permission scopes. Lower levels (1-3) have broader access, while higher
          levels (4-6) have more restricted access. All role modifications are
          logged and audited for security compliance.
        </p>
      </div>
    </div>
  );
}

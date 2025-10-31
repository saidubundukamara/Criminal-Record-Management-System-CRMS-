/**
 * New Role Page
 *
 * Page for creating a new role
 * Pan-African Design: Simple role creation
 */
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { RoleForm, RoleFormData } from "@/components/roles";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NewRolePage() {
  const router = useRouter();

  const handleSubmit = async (data: RoleFormData) => {
    const response = await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create role");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/admin/roles">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Role</h1>
          <p className="text-muted-foreground">
            Create a new role with hierarchy level
          </p>
        </div>
      </div>

      {/* Form */}
      <RoleForm onSubmit={handleSubmit} mode="create" />
    </div>
  );
}

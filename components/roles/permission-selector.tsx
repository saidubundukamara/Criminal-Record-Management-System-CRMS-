/**
 * Permission Selector Component
 *
 * Checkbox-based permission assignment UI
 * Pan-African Design: Clear permission visualization
 */
"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface Permission {
  id: string;
  resource: string;
  action: string;
  scope: string;
  description: string | null;
}

interface PermissionSelectorProps {
  permissions: Permission[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
}

export function PermissionSelector({
  permissions,
  selectedIds,
  onChange,
}: PermissionSelectorProps) {
  const handleToggle = (permissionId: string) => {
    if (selectedIds.includes(permissionId)) {
      onChange(selectedIds.filter((id) => id !== permissionId));
    } else {
      onChange([...selectedIds, permissionId]);
    }
  };

  // Group permissions by resource
  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = [];
    }
    acc[permission.resource].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

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
    <div className="space-y-4">
      {Object.entries(groupedPermissions).map(([resource, perms]) => (
        <Card key={resource}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{resourceLabels[resource] || resource}</CardTitle>
            <CardDescription className="text-xs">
              {perms.length} {perms.length === 1 ? "permission" : "permissions"} available
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {perms.map((permission) => (
                <div key={permission.id} className="flex items-start space-x-2">
                  <Checkbox
                    id={permission.id}
                    checked={selectedIds.includes(permission.id)}
                    onCheckedChange={() => handleToggle(permission.id)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor={permission.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {permission.action}
                      <Badge variant="outline" className="ml-2 text-xs">
                        {permission.scope}
                      </Badge>
                    </Label>
                    {permission.description && (
                      <p className="text-xs text-muted-foreground">
                        {permission.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

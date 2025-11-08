/**
 * Audit Log Filters Component
 *
 * Filter form for audit logs
 *
 * CRMS - Pan-African Digital Public Good
 */
"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X } from "lucide-react";

interface FilterState {
  entityType?: string;
  entityId?: string;
  officerId?: string;
  action?: string;
  success?: boolean;
  fromDate?: string;
  toDate?: string;
}

interface AuditLogFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onApply: () => void;
  onClear: () => void;
}

// Entity types available in the system
const ENTITY_TYPES = [
  { value: "all", label: "All Entity Types" },
  { value: "case", label: "Case" },
  { value: "person", label: "Person" },
  { value: "evidence", label: "Evidence" },
  { value: "officer", label: "Officer" },
  { value: "station", label: "Station" },
  { value: "audit_log", label: "Audit Log" },
  { value: "alert", label: "Alert" },
  { value: "background_check", label: "Background Check" },
];

// Common action types
const ACTIONS = [
  { value: "all", label: "All Actions" },
  { value: "create", label: "Create" },
  { value: "read", label: "Read" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "export", label: "Export" },
  { value: "seal", label: "Seal" },
  { value: "unseal", label: "Unseal" },
];

// Success status options
const SUCCESS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "true", label: "Success Only" },
  { value: "false", label: "Failed Only" },
];

export function AuditLogFilters({
  filters,
  onFilterChange,
  onApply,
  onClear,
}: AuditLogFiltersProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  // Sync local filters with parent filters
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleChange = (key: keyof FilterState, value: string | boolean | undefined) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value === "all" ? undefined : value,
    }));
  };

  const handleApply = () => {
    onFilterChange(localFilters);
    onApply();
  };

  const handleClear = () => {
    setLocalFilters({});
    onClear();
  };

  const hasActiveFilters = Object.keys(localFilters).some(
    (key) => localFilters[key as keyof FilterState] !== undefined
  );

  return (
    <div className="space-y-4">
      {/* Row 1: Entity Type, Action, Success Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Entity Type */}
        <div className="space-y-2">
          <Label htmlFor="entityType">Entity Type</Label>
          <Select
            value={localFilters.entityType || "all"}
            onValueChange={(value) => handleChange("entityType", value)}
          >
            <SelectTrigger id="entityType">
              <SelectValue placeholder="All Entity Types" />
            </SelectTrigger>
            <SelectContent>
              {ENTITY_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action */}
        <div className="space-y-2">
          <Label htmlFor="action">Action</Label>
          <Select
            value={localFilters.action || "all"}
            onValueChange={(value) => handleChange("action", value)}
          >
            <SelectTrigger id="action">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              {ACTIONS.map((action) => (
                <SelectItem key={action.value} value={action.value}>
                  {action.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Success Status */}
        <div className="space-y-2">
          <Label htmlFor="success">Status</Label>
          <Select
            value={
              localFilters.success === undefined
                ? "all"
                : localFilters.success.toString()
            }
            onValueChange={(value) =>
              handleChange("success", value === "all" ? undefined : value === "true")
            }
          >
            <SelectTrigger id="success">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {SUCCESS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 2: Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* From Date */}
        <div className="space-y-2">
          <Label htmlFor="fromDate">From Date</Label>
          <Input
            id="fromDate"
            type="datetime-local"
            value={localFilters.fromDate || ""}
            onChange={(e) => handleChange("fromDate", e.target.value)}
          />
        </div>

        {/* To Date */}
        <div className="space-y-2">
          <Label htmlFor="toDate">To Date</Label>
          <Input
            id="toDate"
            type="datetime-local"
            value={localFilters.toDate || ""}
            onChange={(e) => handleChange("toDate", e.target.value)}
          />
        </div>
      </div>

      {/* Row 3: Entity ID and Officer ID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Entity ID */}
        <div className="space-y-2">
          <Label htmlFor="entityId">Entity ID (Optional)</Label>
          <Input
            id="entityId"
            type="text"
            placeholder="Enter specific entity ID"
            value={localFilters.entityId || ""}
            onChange={(e) => handleChange("entityId", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Filter by a specific case, person, evidence, etc.
          </p>
        </div>

        {/* Officer ID */}
        <div className="space-y-2">
          <Label htmlFor="officerId">Officer ID (Optional)</Label>
          <Input
            id="officerId"
            type="text"
            placeholder="Enter officer ID"
            value={localFilters.officerId || ""}
            onChange={(e) => handleChange("officerId", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Filter by officer who performed the action
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2">
        <Button onClick={handleApply} className="flex-1 md:flex-none">
          <Filter className="h-4 w-4 mr-2" />
          Apply Filters
        </Button>

        {hasActiveFilters && (
          <Button
            onClick={handleClear}
            variant="outline"
            className="flex-1 md:flex-none"
          >
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="text-sm text-muted-foreground">
          Active filters:{" "}
          {Object.entries(localFilters)
            .filter(([_, value]) => value !== undefined)
            .map(([key]) => key)
            .join(", ")}
        </div>
      )}
    </div>
  );
}

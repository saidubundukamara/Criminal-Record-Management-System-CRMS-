/**
 * Case Status Change Dialog Component
 *
 * Dialog for changing case status with workflow validation
 * Pan-African Design: Clear status transitions with validation
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

type CaseStatus = "open" | "investigating" | "charged" | "court" | "closed";

interface CaseStatusChangeDialogProps {
  caseId: string;
  currentStatus: CaseStatus;
  caseNumber: string;
  children?: React.ReactNode;
}

/**
 * Get valid status transitions based on current status
 * Matches domain logic in Case.canTransitionTo()
 */
function getValidNextStatuses(currentStatus: CaseStatus): CaseStatus[] {
  const validTransitions: Record<CaseStatus, CaseStatus[]> = {
    open: ["investigating", "closed"],
    investigating: ["charged", "closed"],
    charged: ["court", "closed"],
    court: ["closed"],
    closed: [], // No transitions from closed
  };

  return validTransitions[currentStatus];
}

/**
 * Get display-friendly status label
 */
function getStatusLabel(status: CaseStatus): string {
  const labels: Record<CaseStatus, string> = {
    open: "Open",
    investigating: "Under Investigation",
    charged: "Charged",
    court: "In Court",
    closed: "Closed",
  };
  return labels[status];
}

/**
 * Get status description
 */
function getStatusDescription(status: CaseStatus): string {
  const descriptions: Record<CaseStatus, string> = {
    open: "Case is newly opened and awaiting assignment or initial investigation",
    investigating:
      "Case is under active investigation by an assigned officer",
    charged: "Suspects have been charged and case is proceeding to court",
    court: "Case is being heard in court proceedings",
    closed: "Case has been resolved and closed. No further action needed.",
  };
  return descriptions[status];
}

export function CaseStatusChangeDialog({
  caseId,
  currentStatus,
  caseNumber,
  children,
}: CaseStatusChangeDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<CaseStatus | "">("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validNextStatuses = getValidNextStatuses(currentStatus);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedStatus) {
      setError("Please select a new status");
      return;
    }

    if (selectedStatus === currentStatus) {
      setError("Please select a different status");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/cases/${caseId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: selectedStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update case status");
      }

      toast({
        title: "Status Updated",
        description: `Case ${caseNumber} status changed to ${getStatusLabel(selectedStatus)}`,
      });

      setOpen(false);
      setSelectedStatus("");
      router.refresh(); // Refresh the page data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      setOpen(newOpen);
      if (!newOpen) {
        setSelectedStatus("");
        setError(null);
      }
    }
  };

  // If case is closed, no transitions allowed
  if (currentStatus === "closed") {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {children || (
            <Button variant="outline" className="w-full justify-start">
              Change Status
            </Button>
          )}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Case Status</DialogTitle>
            <DialogDescription>Case: {caseNumber}</DialogDescription>
          </DialogHeader>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This case is closed. Status cannot be changed.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="w-full justify-start">
            Change Status
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Change Case Status</DialogTitle>
            <DialogDescription>
              Case: {caseNumber} • Current Status:{" "}
              {getStatusLabel(currentStatus)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">New Status</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value) => setSelectedStatus(value as CaseStatus)}
                disabled={isLoading}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {validNextStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {getStatusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedStatus && (
              <Alert>
                <AlertDescription className="text-sm">
                  {getStatusDescription(selectedStatus)}
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {selectedStatus === "closed" && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> Once closed, this case cannot be
                  reopened. Ensure all evidence and persons are properly
                  documented.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !selectedStatus}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Status
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

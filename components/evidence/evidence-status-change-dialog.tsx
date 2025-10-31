/**
 * Evidence Status Change Dialog Component
 *
 * Dialog for changing evidence status with workflow validation
 * Pan-African Design: Clear status transitions with chain of custody tracking
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

type EvidenceStatus =
  | "collected"
  | "stored"
  | "analyzed"
  | "court"
  | "returned"
  | "destroyed";

interface EvidenceStatusChangeDialogProps {
  evidenceId: string;
  currentStatus: EvidenceStatus;
  qrCode: string;
  children?: React.ReactNode;
}

/**
 * Get valid status transitions based on current status
 * Matches domain logic in Evidence.canTransitionTo()
 */
function getValidNextStatuses(
  currentStatus: EvidenceStatus
): EvidenceStatus[] {
  const validTransitions: Record<EvidenceStatus, EvidenceStatus[]> = {
    collected: ["stored", "court"],
    stored: ["analyzed", "court", "returned", "destroyed"],
    analyzed: ["stored", "court"],
    court: ["stored", "returned"],
    returned: ["destroyed"],
    destroyed: [],
  };

  return validTransitions[currentStatus];
}

/**
 * Get display-friendly status label
 */
function getStatusLabel(status: EvidenceStatus): string {
  const labels: Record<EvidenceStatus, string> = {
    collected: "Collected",
    stored: "In Storage",
    analyzed: "Being Analyzed",
    court: "In Court",
    returned: "Returned to Owner",
    destroyed: "Destroyed",
  };
  return labels[status];
}

/**
 * Get status description
 */
function getStatusDescription(status: EvidenceStatus): string {
  const descriptions: Record<EvidenceStatus, string> = {
    collected:
      "Evidence has just been collected from the scene and needs to be stored",
    stored:
      "Evidence is securely stored in the evidence room awaiting further action",
    analyzed:
      "Evidence is currently being analyzed by forensic team or investigators",
    court: "Evidence is being presented in court proceedings",
    returned:
      "Evidence has been returned to its rightful owner after case closure",
    destroyed:
      "Evidence has been destroyed per retention policy. This action is irreversible.",
  };
  return descriptions[status];
}

export function EvidenceStatusChangeDialog({
  evidenceId,
  currentStatus,
  qrCode,
  children,
}: EvidenceStatusChangeDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<EvidenceStatus | "">("");
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
      const response = await fetch(`/api/evidence/${evidenceId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: selectedStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update evidence status");
      }

      toast({
        title: "Status Updated",
        description: `Evidence ${qrCode} status changed to ${getStatusLabel(selectedStatus)}`,
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

  // If evidence is destroyed, no transitions allowed
  if (currentStatus === "destroyed") {
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
            <DialogTitle>Change Evidence Status</DialogTitle>
            <DialogDescription>Evidence: {qrCode}</DialogDescription>
          </DialogHeader>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This evidence has been destroyed. Status cannot be changed.
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
            <DialogTitle>Change Evidence Status</DialogTitle>
            <DialogDescription>
              Evidence: {qrCode} • Current Status:{" "}
              {getStatusLabel(currentStatus)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">New Status</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value) =>
                  setSelectedStatus(value as EvidenceStatus)
                }
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

            {selectedStatus === "destroyed" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> Destruction is permanent and
                  irreversible. Ensure legal retention period has passed and all
                  necessary approvals are obtained.
                </AlertDescription>
              </Alert>
            )}

            {selectedStatus === "court" && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Evidence presented in court must maintain strict chain of
                  custody. Ensure proper documentation before proceeding.
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

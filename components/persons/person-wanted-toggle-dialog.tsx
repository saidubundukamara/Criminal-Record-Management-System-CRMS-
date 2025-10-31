/**
 * Person Wanted Status Toggle Dialog Component
 *
 * Dialog for marking/unmarking a person as wanted
 * Pan-African Design: Clear wanted status management with confirmation
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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, AlertTriangle, UserX, UserCheck } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface PersonWantedToggleDialogProps {
  personId: string;
  isWanted: boolean;
  personName: string;
  children?: React.ReactNode;
}

export function PersonWantedToggleDialog({
  personId,
  isWanted,
  personName,
  children,
}: PersonWantedToggleDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const action = isWanted ? "unmark" : "mark";
  const actionLabel = isWanted ? "Remove Wanted Status" : "Mark as Wanted";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason.trim()) {
      setError(
        `Please provide a reason for ${action}ing this person as wanted`
      );
      return;
    }

    setIsLoading(true);

    try {
      const method = isWanted ? "DELETE" : "POST";
      const response = await fetch(`/api/persons/${personId}/wanted`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: reason.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} as wanted`);
      }

      toast({
        title: isWanted ? "Wanted Status Removed" : "Person Marked as Wanted",
        description: isWanted
          ? `${personName} is no longer marked as wanted`
          : `${personName} has been marked as wanted and will appear in wanted person alerts`,
      });

      setOpen(false);
      setReason("");
      router.refresh(); // Refresh the page data
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} as wanted`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      setOpen(newOpen);
      if (!newOpen) {
        setReason("");
        setError(null);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button
            variant={isWanted ? "outline" : "destructive"}
            className="w-full justify-start"
          >
            {isWanted ? (
              <>
                <UserCheck className="mr-2 h-4 w-4" />
                Remove Wanted Status
              </>
            ) : (
              <>
                <UserX className="mr-2 h-4 w-4" />
                Mark as Wanted
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{actionLabel}</DialogTitle>
            <DialogDescription>Person: {personName}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Action Explanation */}
            {isWanted ? (
              <Alert className="bg-blue-50 border-blue-200">
                <UserCheck className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Removing wanted status will remove this person from wanted
                  person lists and alerts. This action should only be taken when
                  the person has been apprehended or the warrant has been
                  withdrawn.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Mark as Wanted:</strong> This person will be added to
                  wanted person lists, Amber Alerts, and USSD background check
                  systems. This is a serious action that should only be taken
                  with proper authorization.
                </AlertDescription>
              </Alert>
            )}

            {/* Reason Input */}
            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  isWanted
                    ? "Explain why wanted status is being removed (e.g., apprehended, warrant withdrawn, error correction)"
                    : "Provide detailed reason for marking as wanted (e.g., warrant issued, escaped custody, serious crime suspect)"
                }
                rows={4}
                disabled={isLoading}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                Required: This will be logged in the audit trail with your
                officer badge and timestamp.
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Additional Warnings for Marking as Wanted */}
            {!isWanted && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> Ensure you have proper
                  authorization (warrant, commander approval) before marking
                  someone as wanted. False or unauthorized wanted alerts can have
                  serious legal consequences.
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
            <Button
              type="submit"
              variant={isWanted ? "default" : "destructive"}
              disabled={isLoading || !reason.trim()}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isWanted ? "Remove Wanted Status" : "Mark as Wanted"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

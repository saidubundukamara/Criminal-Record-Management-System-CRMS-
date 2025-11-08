/**
 * Evidence Seal Dialog Component
 *
 * Dialog for sealing evidence with tamper protection
 * Pan-African Design: Tamper-evident seals for evidence integrity
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
import {
  AlertCircle,
  Loader2,
  Shield,
  Lock,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface EvidenceSealDialogProps {
  evidenceId: string;
  qrCode: string;
  isSealed: boolean;
  children?: React.ReactNode;
}

export function EvidenceSealDialog({
  evidenceId,
  qrCode,
  isSealed,
  children,
}: EvidenceSealDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const action = "seal";
  const actionLabel = "Seal Evidence";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason.trim()) {
      setError("Please provide a reason for sealing this evidence");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/evidence/${evidenceId}/seal`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} evidence`);
      }

      toast({
        title: isSealed ? "Evidence Unsealed" : "Evidence Sealed",
        description: isSealed
          ? `Evidence ${qrCode} has been unsealed. Seal integrity compromised.`
          : `Evidence ${qrCode} has been sealed with tamper-evident protection.`,
      });

      handleOpenChange(false);
      router.refresh(); // Refresh the page data
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} evidence`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
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
            variant="outline"
            className="w-full justify-start"
            disabled={isSealed}
          >
            <Lock className="mr-2 h-4 w-4" />
            {isSealed ? "Evidence Sealed" : "Seal Evidence"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{actionLabel}</DialogTitle>
            <DialogDescription>Evidence: {qrCode}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Action Explanation */}
            <Alert className="bg-green-50 border-green-200">
              <Shield className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Sealing Evidence:</strong> A tamper-evident seal will be
                  applied to protect evidence integrity. Any future access will
                  require breaking this seal with proper authorization and
                  documentation.
              </AlertDescription>
            </Alert>

            {/* Reason Input */}
            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why evidence needs to be sealed (e.g., protect integrity pending trial, preserve chain of custody, prevent tampering)"
                rows={4}
                disabled={isSubmitting}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                Required: This action will be permanently logged in the audit trail
                with your officer badge and timestamp.
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Additional Warnings */}
            {!isSealed && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Best Practice:</strong> Seal evidence as soon as possible
                  after collection to maintain chain of custody integrity for court
                  admissibility.
                </AlertDescription>
              </Alert>
            )}

            {isSealed && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Legal Note:</strong> Ensure proper authorization before
                  breaking evidence seals. Unauthorized seal breaks may compromise
                  evidence admissibility in court.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={isSealed ? "destructive" : "default"}
              disabled={isSubmitting || !reason.trim()}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSealed ? "Unseal Evidence" : "Seal Evidence"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

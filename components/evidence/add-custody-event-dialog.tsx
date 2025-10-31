/**
 * Add Custody Event Dialog Component
 *
 * Dialog for adding chain of custody events to evidence
 * Pan-African Design: Maintain legal chain of custody for court admissibility
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, ClipboardList, ShieldCheck } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface AddCustodyEventDialogProps {
  evidenceId: string;
  qrCode: string;
  children?: React.ReactNode;
}

const custodyActions = [
  {
    value: "collected",
    label: "Collected",
    description: "Initial collection from crime scene",
  },
  {
    value: "transferred",
    label: "Transferred",
    description: "Transferred to another officer or location",
  },
  {
    value: "accessed",
    label: "Accessed",
    description: "Accessed for examination or analysis",
  },
  {
    value: "returned",
    label: "Returned",
    description: "Returned to owner or authorized party",
  },
  {
    value: "destroyed",
    label: "Destroyed",
    description: "Destroyed per retention policy",
  },
];

export function AddCustodyEventDialog({
  evidenceId,
  qrCode,
  children,
}: AddCustodyEventDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!action) {
      setError("Please select an action");
      return;
    }

    if (!location.trim()) {
      setError("Please specify a location");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/evidence/${evidenceId}/custody`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          location: location.trim(),
          notes: notes.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add custody event");
      }

      toast({
        title: "Custody Event Added",
        description: `${custodyActions.find((a) => a.value === action)?.label} event recorded for evidence ${qrCode}`,
      });

      handleOpenChange(false);
      router.refresh(); // Refresh the page data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add custody event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      setOpen(newOpen);
      if (!newOpen) {
        // Reset form
        setAction("");
        setLocation("");
        setNotes("");
        setError(null);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="w-full justify-start">
            <ClipboardList className="mr-2 h-4 w-4" />
            Add Custody Event
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Chain of Custody Event</DialogTitle>
            <DialogDescription>Evidence: {qrCode}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Info Alert */}
            <Alert className="bg-blue-50 border-blue-200">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                Chain of custody events are immutable and legally binding. Your
                officer badge, name, and timestamp will be automatically recorded.
              </AlertDescription>
            </Alert>

            {/* Action Selection */}
            <div className="space-y-2">
              <Label htmlFor="action">
                Action <span className="text-red-500">*</span>
              </Label>
              <Select value={action} onValueChange={setAction} disabled={isSubmitting}>
                <SelectTrigger id="action">
                  <SelectValue placeholder="Select custody action" />
                </SelectTrigger>
                <SelectContent>
                  {custodyActions.map((custodyAction) => (
                    <SelectItem key={custodyAction.value} value={custodyAction.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{custodyAction.label}</span>
                        <span className="text-xs text-gray-500">
                          {custodyAction.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">
                Location <span className="text-red-500">*</span>
              </Label>
              <Input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Evidence Room 3, Forensics Lab, Officer Desk"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500">
                Specify the physical location where this action took place
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any relevant details about this custody event (purpose, condition of evidence, witnesses present, etc.)"
                rows={3}
                disabled={isSubmitting}
                className="resize-none"
              />
            </div>

            {/* Warning for Destructive Actions */}
            {action === "destroyed" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> Recording destruction is permanent.
                  Ensure proper authorization and retention policy compliance before
                  proceeding.
                </AlertDescription>
              </Alert>
            )}

            {action === "returned" && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Ensure proper documentation and receipt from the authorized
                  recipient before recording return.
                </AlertDescription>
              </Alert>
            )}

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
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
            <Button type="submit" disabled={isSubmitting || !action || !location.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Event
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

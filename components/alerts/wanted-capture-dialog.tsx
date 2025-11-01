/**
 * Wanted Person Capture Dialog Component
 *
 * Dialog for marking a wanted person as captured
 * Pan-African Design: Clear confirmation with success feedback
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface WantedCaptureDialogProps {
  wantedId: string;
  personName: string;
  children?: React.ReactNode;
}

export function WantedCaptureDialog({
  wantedId,
  personName,
  children,
}: WantedCaptureDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/alerts/wanted/${wantedId}/capture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to mark wanted person as captured");
      }

      toast({
        title: "Wanted Person Captured",
        description: `${personName} has been marked as captured. The wanted alert is now inactive.`,
      });

      setOpen(false);
      router.refresh(); // Refresh the page data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark as captured");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="w-full bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark as Captured
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Wanted Person as Captured</DialogTitle>
          <DialogDescription>
            Are you sure you want to mark {personName} as captured? This will change the wanted
            alert status to &quot;captured&quot; and deactivate the alert.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCapture}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Marking as Captured...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirm - Mark as Captured
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

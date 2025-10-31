/**
 * Person Risk Level Update Dialog Component
 *
 * Dialog for updating person risk assessment level
 * Pan-African Design: Clear risk assessment with guidance
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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

type RiskLevel = "low" | "medium" | "high" | null;

interface PersonRiskLevelDialogProps {
  personId: string;
  currentRiskLevel: RiskLevel;
  personName: string;
  children?: React.ReactNode;
}

/**
 * Get display-friendly risk label
 */
function getRiskLabel(risk: RiskLevel): string {
  if (risk === "high") return "High Risk";
  if (risk === "medium") return "Medium Risk";
  if (risk === "low") return "Low Risk";
  return "Not Assessed";
}

/**
 * Get risk level description
 */
function getRiskDescription(risk: RiskLevel): string {
  const descriptions = {
    low: "Person poses minimal risk. No history of violent behavior. Low likelihood of reoffending.",
    medium:
      "Person requires monitoring. Some history of concerning behavior. Moderate risk of reoffending.",
    high: "Person poses significant risk. History of violent or serious offenses. High priority for monitoring.",
    null: "Risk level not yet assessed. Assessment required for proper case handling.",
  };
  return descriptions[risk as keyof typeof descriptions] || descriptions.null;
}

/**
 * Get risk level color
 */
function getRiskColor(risk: RiskLevel): string {
  if (risk === "high") return "text-red-600 bg-red-50 border-red-200";
  if (risk === "medium") return "text-yellow-600 bg-yellow-50 border-yellow-200";
  if (risk === "low") return "text-green-600 bg-green-50 border-green-200";
  return "text-gray-600 bg-gray-50 border-gray-200";
}

export function PersonRiskLevelDialog({
  personId,
  currentRiskLevel,
  personName,
  children,
}: PersonRiskLevelDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<string>(
    currentRiskLevel || ""
  );
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedRisk) {
      setError("Please select a risk level");
      return;
    }

    if (selectedRisk === currentRiskLevel) {
      setError("Please select a different risk level");
      return;
    }

    if (!notes.trim()) {
      setError(
        "Please provide a reason/justification for this risk assessment"
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/persons/${personId}/risk`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          riskLevel: selectedRisk === "null" ? null : selectedRisk,
          notes: notes.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update risk level");
      }

      toast({
        title: "Risk Level Updated",
        description: `${personName} risk level changed to ${getRiskLabel(selectedRisk === "null" ? null : (selectedRisk as RiskLevel))}`,
      });

      setOpen(false);
      setSelectedRisk(currentRiskLevel || "");
      setNotes("");
      router.refresh(); // Refresh the page data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update risk level");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      setOpen(newOpen);
      if (!newOpen) {
        setSelectedRisk(currentRiskLevel || "");
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
            Update Risk Level
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Update Risk Assessment</DialogTitle>
            <DialogDescription>
              Person: {personName} • Current Risk:{" "}
              {getRiskLabel(currentRiskLevel)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Current Risk Display */}
            {currentRiskLevel && (
              <div
                className={`p-3 rounded-lg border ${getRiskColor(currentRiskLevel)}`}
              >
                <div className="flex items-center gap-2">
                  {currentRiskLevel === "high" && (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  {(currentRiskLevel === "medium" ||
                    currentRiskLevel === "low") && (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  <span className="font-semibold">
                    Current: {getRiskLabel(currentRiskLevel)}
                  </span>
                </div>
                <p className="text-sm mt-1">
                  {getRiskDescription(currentRiskLevel)}
                </p>
              </div>
            )}

            {/* Risk Level Selection */}
            <div className="space-y-2">
              <Label htmlFor="risk">New Risk Level</Label>
              <Select
                value={selectedRisk}
                onValueChange={setSelectedRisk}
                disabled={isLoading}
              >
                <SelectTrigger id="risk">
                  <SelectValue placeholder="Select risk level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Not Assessed</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Risk Description */}
            {selectedRisk && selectedRisk !== String(currentRiskLevel) && (
              <Alert
                className={getRiskColor(
                  selectedRisk === "null" ? null : (selectedRisk as RiskLevel)
                )}
              >
                <AlertDescription className="text-sm">
                  {getRiskDescription(
                    selectedRisk === "null" ? null : (selectedRisk as RiskLevel)
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Notes/Justification */}
            <div className="space-y-2">
              <Label htmlFor="notes">
                Assessment Notes <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Provide detailed reasoning for this risk assessment. Include factors considered, behavioral patterns, criminal history, etc."
                rows={4}
                disabled={isLoading}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                Required: Explain the rationale for this risk level change. This
                will be logged in the audit trail.
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* High Risk Warning */}
            {selectedRisk === "high" && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>High Risk Classification:</strong> This person will be
                  flagged for enhanced monitoring and special handling procedures.
                  Ensure thorough documentation supports this assessment.
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
              disabled={isLoading || !selectedRisk || !notes.trim()}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Risk Level
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

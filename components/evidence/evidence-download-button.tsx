/**
 * Evidence Download Button Component
 *
 * Client component for secure evidence file downloads with audit trail
 * Pan-African Design: Secure downloads with access logging
 */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface EvidenceDownloadButtonProps {
  evidenceId: string;
  fileName: string;
  variant?: "outline" | "default" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function EvidenceDownloadButton({
  evidenceId,
  fileName,
  variant = "outline",
  size = "sm",
  className = "",
}: EvidenceDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      // Get presigned URL from API
      const response = await fetch(`/api/evidence/${evidenceId}/download`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate download URL");
      }

      const data = await response.json();

      // Open download in new tab
      window.open(data.downloadUrl, "_blank");

      toast({
        title: "Download Started",
        description: `Downloading ${fileName}. This action has been logged.`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to download file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={isDownloading}
      className={className}
    >
      {isDownloading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {isDownloading ? "Preparing Download..." : "Download File"}
    </Button>
  );
}

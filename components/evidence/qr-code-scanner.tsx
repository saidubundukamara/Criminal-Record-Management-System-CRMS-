/**
 * QR Code Scanner Component
 *
 * Mobile-friendly QR code scanner with manual entry fallback
 * Pan-African Design: Works in low-tech environments with manual entry option
 */
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Camera,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ScanLine,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export function QRCodeScanner() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("manual");
  const [manualCode, setManualCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check camera support
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      setCameraSupported(false);
    }
  }, []);

  const handleSearch = async (qrCode: string) => {
    if (!qrCode.trim()) {
      setError("Please enter a QR code");
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      // Search for evidence by QR code
      const response = await fetch(
        `/api/evidence?qrCode=${encodeURIComponent(qrCode.trim())}`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Evidence not found");
      }

      const data = await response.json();

      if (!data.evidence || data.evidence.length === 0) {
        throw new Error("No evidence found with this QR code");
      }

      // Redirect to evidence detail page
      toast({
        title: "Evidence Found",
        description: `Redirecting to ${qrCode}`,
      });

      router.push(`/dashboard/evidence/${data.evidence[0].id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to find evidence");
      toast({
        title: "Not Found",
        description: err instanceof Error ? err.message : "Evidence not found",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(manualCode);
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices || !videoRef.current) {
      setCameraSupported(false);
      toast({
        title: "Camera Not Supported",
        description: "Your browser doesn't support camera access. Use manual entry instead.",
        variant: "destructive",
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera on mobile
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      setCameraSupported(false);
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access or use manual entry.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Card className="p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">
            <Search className="h-4 w-4 mr-2" />
            Manual Entry
          </TabsTrigger>
          <TabsTrigger value="camera" disabled={!cameraSupported}>
            <Camera className="h-4 w-4 mr-2" />
            Camera Scan
          </TabsTrigger>
        </TabsList>

        {/* Manual Entry Tab */}
        <TabsContent value="manual" className="space-y-4">
          <div className="text-center py-4">
            <ScanLine className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Enter QR Code Manually</h3>
            <p className="text-sm text-gray-600">
              Type the QR code from the evidence label to look it up
            </p>
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="qrCode">Evidence QR Code</Label>
              <Input
                id="qrCode"
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="e.g., EV-2025-000123"
                className="font-mono text-lg"
                autoFocus
                disabled={isSearching}
              />
              <p className="text-xs text-gray-500">
                Enter the code exactly as shown on the evidence label
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSearching || !manualCode.trim()}
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  Search Evidence
                </>
              )}
            </Button>
          </form>

          <Alert className="bg-blue-50 border-blue-200">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              <strong>Tip:</strong> QR codes are usually in the format EV-YYYY-NNNNNN
              where YYYY is the year and NNNNNN is a sequential number.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Camera Scan Tab */}
        <TabsContent value="camera" className="space-y-4">
          <div className="text-center py-4">
            <Camera className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Scan with Camera</h3>
            <p className="text-sm text-gray-600">
              Point your camera at the evidence QR code to scan it
            </p>
          </div>

          {!cameraActive ? (
            <div className="space-y-4">
              <Button
                onClick={startCamera}
                className="w-full"
                size="lg"
                disabled={!cameraSupported}
              >
                <Camera className="mr-2 h-5 w-5" />
                Start Camera
              </Button>

              {!cameraSupported && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Camera not supported on this device. Please use manual entry instead.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-4 border-white rounded-lg w-64 h-64 opacity-50" />
                </div>
              </div>

              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800 text-sm">
                  <strong>Note:</strong> QR code scanning requires a QR code detection library.
                  For now, please use the manual entry tab or scan with your phone's camera app
                  and enter the code manually.
                </AlertDescription>
              </Alert>

              <Button
                onClick={stopCamera}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Stop Camera
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}

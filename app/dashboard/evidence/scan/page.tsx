/**
 * QR Code Scanner Page
 *
 * Mobile-friendly page for scanning evidence QR codes
 * Pan-African Design: Quick evidence lookup for field officers
 */
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QRCodeScanner } from "@/components/evidence/qr-code-scanner";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Scan Evidence QR Code - CRMS",
  description: "Scan evidence QR codes for quick lookup",
};

export default async function ScanQRCodePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/evidence">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Evidence
            </Button>
          </Link>
        </div>
      </div>

      {/* Page Title */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Scan Evidence QR Code</h1>
        <p className="text-gray-600 mt-2">
          Use your camera or enter the QR code manually to quickly look up evidence
        </p>
      </div>

      {/* Scanner Component */}
      <QRCodeScanner />
    </div>
  );
}

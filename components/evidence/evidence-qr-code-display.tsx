/**
 * Evidence QR Code Display Component
 *
 * Displays QR code for evidence tracking with print functionality
 * Pan-African Design: Physical evidence tracking for low-tech environments
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Printer, Download } from "lucide-react";

interface EvidenceQRCodeDisplayProps {
  qrCode: string;
  description: string;
  evidenceType: string;
}

export function EvidenceQRCodeDisplay({
  qrCode,
  description,
  evidenceType,
}: EvidenceQRCodeDisplayProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  useEffect(() => {
    // Generate QR code using a CDN library for simplicity
    // In production, you might want to use a library like 'qrcode' or 'qrcode.react'
    const generateQRCode = async () => {
      try {
        // Using Google Charts API as a simple solution (no npm package needed)
        // Alternative: Use 'qrcode' library with npm install
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCode)}`;
        setQrCodeDataUrl(qrUrl);
      } catch (error) {
        console.error("Error generating QR code:", error);
      }
    };

    generateQRCode();
  }, [qrCode]);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Evidence QR Code - ${qrCode}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .qr-container {
              text-align: center;
              page-break-after: always;
            }
            .qr-code {
              margin: 20px auto;
              border: 2px solid #000;
              padding: 10px;
              background: white;
            }
            .qr-info {
              margin-top: 20px;
              font-size: 14px;
            }
            .qr-code-text {
              font-size: 24px;
              font-weight: bold;
              margin: 10px 0;
              font-family: monospace;
            }
            @media print {
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h1>Criminal Record Management System</h1>
            <h2>Evidence QR Code</h2>
            <div class="qr-code">
              <img src="${qrCodeDataUrl}" alt="QR Code" width="300" height="300" />
            </div>
            <div class="qr-code-text">${qrCode}</div>
            <div class="qr-info">
              <p><strong>Type:</strong> ${evidenceType}</p>
              <p><strong>Description:</strong> ${description}</p>
              <p style="margin-top: 20px; font-size: 12px; color: #666;">
                Scan this QR code to quickly access evidence details in CRMS
              </p>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    // Create a canvas to draw the QR code with labels
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 500;

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add title
    ctx.fillStyle = "#000000";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("CRMS Evidence", canvas.width / 2, 30);

    // Load and draw QR code image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.drawImage(img, 50, 50, 300, 300);

      // Add QR code text
      ctx.font = "bold 20px monospace";
      ctx.fillText(qrCode, canvas.width / 2, 380);

      // Add description
      ctx.font = "14px Arial";
      ctx.fillText(`Type: ${evidenceType}`, canvas.width / 2, 410);

      // Wrap description text
      const maxWidth = 360;
      const words = description.split(" ");
      let line = "";
      let y = 440;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line, canvas.width / 2, y);
          line = words[n] + " ";
          y += 20;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, canvas.width / 2, y);

      // Download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `evidence-qr-${qrCode}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    };
    img.src = qrCodeDataUrl;
  };

  return (
    <Card className="p-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-4">Evidence QR Code</h3>

        <div ref={qrRef} className="bg-white p-4 inline-block border-2 border-gray-300 rounded-lg">
          {qrCodeDataUrl ? (
            <img
              src={qrCodeDataUrl}
              alt={`QR Code for ${qrCode}`}
              width={250}
              height={250}
              className="mx-auto"
            />
          ) : (
            <div className="w-[250px] h-[250px] bg-gray-100 animate-pulse rounded" />
          )}
        </div>

        <div className="mt-3">
          <p className="font-mono text-lg font-bold text-gray-900">{qrCode}</p>
          <p className="text-sm text-gray-500 mt-1">
            Scan to access evidence details
          </p>
        </div>

        <div className="flex gap-2 justify-center mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            disabled={!qrCodeDataUrl}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print QR Code
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={!qrCodeDataUrl}
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Attach this QR code to physical evidence for easy tracking
        </p>
      </div>
    </Card>
  );
}

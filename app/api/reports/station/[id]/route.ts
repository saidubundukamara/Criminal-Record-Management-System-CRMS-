/**
 * Station Performance Report PDF Generation API
 *
 * GET /api/reports/station/[id]?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * - Generates station performance report for specified period
 * - Includes metrics, case breakdowns, and top officers
 * - Returns PDF as downloadable file
 *
 * RBAC: Station commanders can view own station, Regional/National can view any
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { hasPermission } from "@/lib/permissions";
import { renderToStream } from "@react-pdf/renderer";
import { StationReportPDF } from "@/components/reports/station-report-pdf";
import React from "react";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Permission check
    if (!hasPermission(session, "reports", "read", "station")) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions to generate station reports" },
        { status: 403 }
      );
    }

    const { id: stationId } = await params;

    // Verify station access
    if (stationId !== session.user.stationId) {
      if (!hasPermission(session, "reports", "read", "national")) {
        return NextResponse.json(
          { error: "Forbidden: You can only generate reports for your own station" },
          { status: 403 }
        );
      }
    }

    // Get date range from query params
    const searchParams = request.nextUrl.searchParams;
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: "Missing required parameters: startDate and endDate (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // Generate report data using ReportService
    const reportService = container.reportService;
    const reportData = await reportService.generateStationReport(
      stationId,
      startDate,
      endDate,
      session.user.id
    );

    // Generate PDF
    const pdfStream = await renderToStream(
      React.createElement(StationReportPDF, { data: reportData }) as any
    );

    // Convert stream to buffer
    const chunks: any[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    // Return PDF as downloadable file
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="station-${reportData.station.code}-${reportData.period.label.replace(/\s+/g, '-')}-report.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("Station report generation error:", error);

    // Audit failure
    const session = await getServerSession(authOptions);
    const { id: stationId } = await params;
    if (session?.user) {
      await container.auditLogRepository.create({
        entityType: "report",
        entityId: stationId,
        action: "generate",
        officerId: session.user.id,
        stationId: session.user.stationId,
        success: false,
        details: { error: error.message, reportType: "station" },
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      });
    }

    if (error.name === "ValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to generate station report" },
      { status: 500 }
    );
  }
}

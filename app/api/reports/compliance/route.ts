/**
 * Compliance Report PDF Generation API
 *
 * GET /api/reports/compliance?type=gdpr|malabo|audit&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * - Generates compliance reports for data protection authorities
 * - Supports GDPR, Malabo Convention, and internal audit reports
 * - Returns PDF as downloadable file
 *
 * RBAC: National scope required (SuperAdmin, Admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { hasPermission } from "@/lib/permissions";
import { renderToStream } from "@react-pdf/renderer";
import { ComplianceReportPDF } from "@/components/reports/compliance-report-pdf";
import React from "react";

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Permission check: Must have NATIONAL scope
    if (!hasPermission(session, "reports", "read", "national")) {
      return NextResponse.json(
        {
          error:
            "Forbidden: National-level permissions required to generate compliance reports",
        },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get("type") as "gdpr" | "malabo" | "audit" | null;
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    // Validate report type
    if (!reportType || !["gdpr", "malabo", "audit"].includes(reportType)) {
      return NextResponse.json(
        { error: "Invalid report type. Must be: gdpr, malabo, or audit" },
        { status: 400 }
      );
    }

    // Validate date range
    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: "Missing required parameters: startDate and endDate (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // Generate report data using ReportService
    const reportService = container.reportService;
    const reportData = await reportService.generateComplianceReport(
      reportType,
      startDate,
      endDate,
      session.user.id
    );

    // Generate PDF
    const pdfStream = await renderToStream(
      React.createElement(ComplianceReportPDF, { data: reportData }) as any
    );

    // Convert stream to buffer
    const chunks: any[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    // Format filename
    const dateStr = `${startDate.toISOString().split("T")[0]}_to_${endDate.toISOString().split("T")[0]}`;
    const filename = `compliance-${reportType}-${dateStr}.pdf`;

    // Return PDF as downloadable file
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("Compliance report generation error:", error);

    // Audit failure
    const session = await getServerSession(authOptions);
    if (session?.user) {
      await container.auditLogRepository.create({
        entityType: "report",
        entityId: "compliance",
        action: "generate",
        officerId: session.user.id,
        stationId: session.user.stationId,
        success: false,
        details: { error: error.message, reportType: "compliance" },
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
      { error: "Failed to generate compliance report" },
      { status: 500 }
    );
  }
}

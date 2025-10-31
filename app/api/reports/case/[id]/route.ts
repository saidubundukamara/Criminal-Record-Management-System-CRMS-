/**
 * Case Report PDF Generation API
 *
 * GET /api/reports/case/[id]
 * - Generates comprehensive PDF report for a specific case
 * - Includes case details, persons, evidence, and audit trail
 * - Returns PDF as downloadable file
 *
 * RBAC: Officers can view cases in their scope
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { hasPermission } from "@/lib/permissions";
import { renderToStream } from "@react-pdf/renderer";
import { CaseReportPDF } from "@/components/reports/case-report-pdf";
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
    if (!hasPermission(session, "reports", "read", "own")) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions to generate reports" },
        { status: 403 }
      );
    }

    const { id: caseId } = await params;

    // Generate report data using ReportService
    const reportService = container.reportService;
    const reportData = await reportService.generateCaseReport(
      caseId,
      session.user.id
    );

    // Generate PDF
    const pdfStream = await renderToStream(
      React.createElement(CaseReportPDF, { data: reportData }) as any
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
        "Content-Disposition": `attachment; filename="case-${reportData.case.caseNumber}-report.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("Case report generation error:", error);

    // Audit failure
    const session = await getServerSession(authOptions);
    const { id: caseId } = await params;
    if (session?.user) {
      await container.auditLogRepository.create({
        entityType: "report",
        entityId: caseId,
        action: "generate",
        officerId: session.user.id,
        stationId: session.user.stationId,
        success: false,
        details: { error: error.message, reportType: "case" },
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      });
    }

    if (error.name === "NotFoundError") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to generate case report" },
      { status: 500 }
    );
  }
}

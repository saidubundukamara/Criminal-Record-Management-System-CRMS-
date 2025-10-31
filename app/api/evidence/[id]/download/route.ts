/**
 * Evidence File Download API Route
 *
 * GET /api/evidence/[id]/download - Get presigned URL for evidence file download
 *
 * Pan-African Design: Secure file downloads with audit trail
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { hasPermission } from "@/lib/permissions";
import { NotFoundError, ForbiddenError } from "@/src/lib/errors";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/evidence/[id]/download
 * Generate a presigned URL for secure file download
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: evidenceId } = await context.params;

    // Check permissions - need read access to evidence
    if (!hasPermission(session, "evidence", "read", "own")) {
      throw new ForbiddenError("Insufficient permissions to download evidence files");
    }

    const evidenceService = container.evidenceService;
    const auditRepo = container.auditLogRepository;

    // Get evidence to check if file exists
    const evidence = await evidenceService.getEvidenceById(evidenceId, session.user.id);

    if (!evidence) {
      throw new NotFoundError("Evidence not found");
    }

    if (!evidence.fileUrl || !evidence.fileKey) {
      return NextResponse.json(
        { error: "This evidence has no associated file" },
        { status: 404 }
      );
    }

    // Generate presigned URL for secure download (expires in 1 hour)
    const { generateDownloadUrl } = await import("@/lib/s3");
    const downloadUrl = await generateDownloadUrl(evidence.fileKey, 3600);

    // Audit log the download
    await auditRepo.create({
      entityType: "evidence",
      entityId: evidenceId,
      officerId: session.user.id,
      action: "read",
      success: true,
      details: {
        operation: "download_file",
        fileName: evidence.fileName,
        fileSize: evidence.fileSize,
        qrCode: evidence.qrCode,
      },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      stationId: session.user.stationId,
    });

    return NextResponse.json(
      {
        downloadUrl,
        fileName: evidence.fileName,
        fileSize: evidence.fileSize,
        fileMimeType: evidence.fileMimeType,
        expiresIn: 3600, // 1 hour (for presigned URLs)
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error generating download URL:", error);

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to generate download URL" },
      { status: 500 }
    );
  }
}

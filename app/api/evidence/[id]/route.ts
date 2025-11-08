/**
 * Evidence API Routes (Individual)
 *
 * GET    /api/evidence/[id] - Get evidence by ID
 * PATCH  /api/evidence/[id] - Update evidence
 * DELETE /api/evidence/[id] - Delete evidence
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { hasPermission } from "@/lib/permissions";
import { UpdateEvidenceInput } from "@/src/services/EvidenceService";
import { ValidationError, NotFoundError, ForbiddenError } from "@/src/lib/errors";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/evidence/[id]
 * Get evidence by ID with case information
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(session, "evidence", "read", "station")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;

    // Get evidence with case info
    const evidence = await container.evidenceService.getEvidenceWithCase(
      id,
      session.user.id
    );

    return NextResponse.json(
      {
        evidence: {
          id: evidence.id,
          qrCode: evidence.qrCode,
          qrCodeData: evidence.getQRCodeData(),
          caseId: evidence.caseId,
          case: evidence.case,
          type: evidence.type,
          description: evidence.description,
          status: evidence.status,
          collectedDate: evidence.collectedDate,
          collectedLocation: evidence.collectedLocation,
          collectedBy: evidence.collectedBy,
          isSealed: evidence.isSealed,
          sealedAt: evidence.sealedAt,
          sealedBy: evidence.sealedBy,
          isDigital: evidence.isDigital(),
          fileUrl: evidence.fileUrl,
          fileName: evidence.fileName,
          fileSize: evidence.fileSize,
          fileMimeType: evidence.fileMimeType,
          fileHash: evidence.fileHash,
          humanReadableSize: evidence.getHumanReadableFileSize(),
          storageLocation: evidence.storageLocation,
          tags: evidence.tags,
          notes: evidence.notes,
          chainOfCustody: evidence.chainOfCustody,
          chainOfCustodyText: evidence.getCustodyChainText(),
          custodyTransferCount: evidence.getCustodyTransferCount(),
          currentCustodian: evidence.getCurrentCustodian(),
          handlingOfficers: evidence.getHandlingOfficers(),
          ageInDays: evidence.getAgeInDays(),
          isStale: evidence.isStale(),
          canBeDestroyed: evidence.canBeDestroyed(),
          isCritical: evidence.isCritical(),
          requiresSpecialHandling: evidence.requiresSpecialHandling(),
          isReadyForCourt: evidence.isReadyForCourt(),
          summary: evidence.getSummary(),
          createdAt: evidence.createdAt,
          updatedAt: evidence.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching evidence:", error);

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/evidence/[id]
 * Update evidence
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(session, "evidence", "update", "station")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;

    // Parse form data (supports consistency with creation route)
    const formData = await request.formData();

    // Extract form fields
    const type = formData.get("type") as string | null;
    const description = formData.get("description") as string | null;
    const collectedLocation = formData.get("collectedLocation") as string | null;
    const storageLocation = formData.get("storageLocation") as string | null;
    const tagsString = formData.get("tags") as string | null;
    const tags = tagsString ? tagsString.split(",").map(t => t.trim()) : undefined;
    const notes = formData.get("notes") as string | null;

    // Prepare input (only include defined values)
    const input: UpdateEvidenceInput = {
      ...(type && { type: type as any }),
      ...(description && { description }),
      ...(collectedLocation !== null && { collectedLocation }),
      ...(storageLocation !== null && { storageLocation }),
      ...(tags && { tags }),
      ...(notes !== null && { notes }),
    };

    // Update evidence
    const evidence = await container.evidenceService.updateEvidence(
      id,
      input,
      session.user.id,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json(
      {
        evidence: {
          id: evidence.id,
          qrCode: evidence.qrCode,
          type: evidence.type,
          description: evidence.description,
          status: evidence.status,
          storageLocation: evidence.storageLocation,
          tags: evidence.tags,
          notes: evidence.notes,
          updatedAt: evidence.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating evidence:", error);

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/evidence/[id]
 * Delete evidence (only if in collected or stored status)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(session, "evidence", "delete", "station")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;

    // Delete evidence
    await container.evidenceService.deleteEvidence(
      id,
      session.user.id,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json(
      { message: "Evidence deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting evidence:", error);

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

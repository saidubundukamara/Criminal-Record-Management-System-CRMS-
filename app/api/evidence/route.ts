/**
 * Evidence API Routes
 *
 * GET  /api/evidence - List/search evidence with filters
 * POST /api/evidence - Create new evidence
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { hasPermission } from "@/lib/permissions";
import { EvidenceFilters } from "@/src/domain/interfaces/repositories/IEvidenceRepository";
import { CreateEvidenceInput } from "@/src/services/EvidenceService";
import { ValidationError, NotFoundError, ForbiddenError } from "@/src/lib/errors";

/**
 * GET /api/evidence
 * List/search evidence with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(session, "evidence", "read", "station")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || undefined;
    const caseId = searchParams.get("caseId") || undefined;
    const type = searchParams.get("type") || undefined;
    const status = searchParams.get("status") || undefined;
    const isSealed = searchParams.get("isSealed") === "true" ? true : undefined;
    const isDigital = searchParams.get("isDigital") === "true" ? true : undefined;
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build filters
    const filters: EvidenceFilters = {
      search,
      caseId,
      type: type as any,
      status: status as any,
      isSealed,
      isDigital,
      stationId: session.user.stationId, // Filter by user's station
    };

    // Get evidence
    const { evidence, total } = await container.evidenceService.searchEvidence(
      filters,
      session.user.id,
      limit,
      offset
    );

    return NextResponse.json(
      {
        evidence: evidence.map((e) => ({
          id: e.id,
          qrCode: e.qrCode,
          caseId: e.caseId,
          type: e.type,
          description: e.description,
          status: e.status,
          collectedDate: e.collectedDate,
          collectedLocation: e.collectedLocation,
          isSealed: e.isSealed,
          isDigital: e.isDigital(),
          fileUrl: e.fileUrl,
          fileName: e.fileName,
          fileSize: e.fileSize,
          humanReadableSize: e.getHumanReadableFileSize(),
          storageLocation: e.storageLocation,
          tags: e.tags,
          custodyTransferCount: e.getCustodyTransferCount(),
          currentCustodian: e.getCurrentCustodian(),
          isCritical: e.isCritical(),
          ageInDays: e.getAgeInDays(),
          createdAt: e.createdAt,
          updatedAt: e.updatedAt,
        })),
        total,
        limit,
        offset,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching evidence:", error);

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
 * POST /api/evidence
 * Create new evidence with optional file upload
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(session, "evidence", "create", "station")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse form data (supports file uploads)
    const formData = await request.formData();

    // Extract form fields
    const caseId = formData.get("caseId") as string;
    const type = formData.get("type") as string;
    const description = formData.get("description") as string | null;
    const collectedDate = formData.get("collectedDate") as string;
    const collectedLocation = formData.get("collectedLocation") as string | null;
    const storageLocation = formData.get("storageLocation") as string | null;
    const tagsString = formData.get("tags") as string | null;
    const tags = tagsString ? tagsString.split(",").map(t => t.trim()) : [];
    const notes = formData.get("notes") as string | null;

    // Handle file upload if present
    const file = formData.get("file") as File | null;
    let fileData: CreateEvidenceInput["file"] = undefined;

    if (file) {
      // Validate file
      const { uploadFile, validateFileType } = await import("@/lib/s3");

      if (!validateFileType(file.type)) {
        return NextResponse.json(
          { error: "Invalid file type. Please upload a supported file format." },
          { status: 400 }
        );
      }

      // Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer());

      // Upload to S3
      const uploadResult = await uploadFile(
        buffer,
        file.name,
        file.type,
        "evidence/"
      );

      fileData = {
        url: uploadResult.url,
        name: file.name,
        size: uploadResult.size,
        mimeType: file.type,
        hash: uploadResult.hash,
      };
    }

    // Prepare input
    const input: CreateEvidenceInput = {
      caseId,
      type: type as any,
      description: description || "",
      collectedDate: collectedDate,
      collectedLocation: collectedLocation || "",
      storageLocation: storageLocation || undefined,
      tags,
      notes: notes || undefined,
      file: fileData,
    };

    // Create evidence
    const evidence = await container.evidenceService.createEvidence(
      input,
      session.user.id,
      session.user.stationId,
      {
        name: session.user.name,
        badge: session.user.badge,
      },
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json(
      {
        evidence: {
          id: evidence.id,
          qrCode: evidence.qrCode,
          qrCodeData: evidence.getQRCodeData(),
          caseId: evidence.caseId,
          type: evidence.type,
          description: evidence.description,
          status: evidence.status,
          collectedDate: evidence.collectedDate,
          collectedLocation: evidence.collectedLocation,
          isSealed: evidence.isSealed,
          isDigital: evidence.isDigital(),
          fileUrl: evidence.fileUrl,
          fileName: evidence.fileName,
          fileSize: evidence.fileSize,
          storageLocation: evidence.storageLocation,
          tags: evidence.tags,
          chainOfCustody: evidence.chainOfCustody,
          notes: evidence.notes,
          createdAt: evidence.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating evidence:", error);

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

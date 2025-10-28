/**
 * Evidence Status API Route
 *
 * PATCH /api/evidence/[id]/status - Update evidence status
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { hasPermission } from "@/lib/permissions";
import { EvidenceStatus } from "@/src/domain/entities/Evidence";
import { ValidationError, NotFoundError, ForbiddenError } from "@/src/lib/errors";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * PATCH /api/evidence/[id]/status
 * Update evidence status with validation
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
    const body = await request.json();
    const { status, reason } = body;

    // Validate status
    const validStatuses: EvidenceStatus[] = [
      "collected",
      "stored",
      "analyzed",
      "court",
      "returned",
      "destroyed",
    ];

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Update status
    const evidence = await container.evidenceService.updateEvidenceStatus(
      id,
      status,
      session.user.id,
      reason,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json(
      {
        evidence: {
          id: evidence.id,
          qrCode: evidence.qrCode,
          status: evidence.status,
          updatedAt: evidence.updatedAt,
        },
        message: `Evidence status updated to ${status}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating evidence status:", error);

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

/**
 * Evidence Seal API Route
 *
 * PATCH /api/evidence/[id]/seal - Seal evidence (tamper-evident)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { hasPermission } from "@/lib/permissions";
import { ValidationError, NotFoundError, ForbiddenError } from "@/src/lib/errors";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * PATCH /api/evidence/[id]/seal
 * Seal evidence to prevent tampering
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

    // Seal evidence
    const evidence = await container.evidenceService.sealEvidence(
      id,
      session.user.id,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json(
      {
        evidence: {
          id: evidence.id,
          qrCode: evidence.qrCode,
          isSealed: evidence.isSealed,
          sealedAt: evidence.sealedAt,
          sealedBy: evidence.sealedBy,
          updatedAt: evidence.updatedAt,
        },
        message: `Evidence ${evidence.qrCode} has been sealed`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sealing evidence:", error);

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

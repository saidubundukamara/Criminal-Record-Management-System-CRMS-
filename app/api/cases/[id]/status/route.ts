/**
 * Case Status Update API Route
 *
 * Endpoint:
 * PATCH /api/cases/[id]/status - Update case status
 *
 * Validates status transitions using domain logic
 * Authentication: Required (NextAuth session)
 * Permissions: cases:update
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { ValidationError, NotFoundError, ForbiddenError } from "@/src/lib/errors";
import { CaseStatus } from "@/src/domain/entities/Case";

export interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * PATCH /api/cases/[id]/status
 * Update case status with workflow validation
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    // Validate status
    const validStatuses: CaseStatus[] = [
      "open",
      "investigating",
      "charged",
      "court",
      "closed",
    ];

    if (!body.status || !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Update status
    const updatedCase = await container.caseService.updateCaseStatus(
      id,
      body.status as CaseStatus,
      session.user.id,
      body.reason,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json({
      case: updatedCase,
      message: `Case status updated to ${body.status}`,
    });
  } catch (error) {
    console.error(`PATCH /api/cases/[id]/status error:`, error);

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

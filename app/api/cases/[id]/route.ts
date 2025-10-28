/**
 * Individual Case API Routes
 *
 * Endpoints:
 * GET /api/cases/[id] - Get case by ID
 * PATCH /api/cases/[id] - Update case
 * DELETE /api/cases/[id] - Delete case
 *
 * Authentication: Required (NextAuth session)
 * Permissions: cases:read, cases:update, cases:delete
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { ValidationError, NotFoundError, ForbiddenError } from "@/src/lib/errors";

export interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/cases/[id]
 * Get case by ID with full details
 */
export async function GET(
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

    // Get case with relations
    const caseData = await container.caseService.getCaseById(
      id,
      session.user.id,
      true // Include relations
    );

    return NextResponse.json({ case: caseData });
  } catch (error) {
    console.error(`GET /api/cases/[id] error:`, error);

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/cases/[id]
 * Update case details
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

    // Update case
    const updatedCase = await container.caseService.updateCase(
      id,
      {
        title: body.title,
        description: body.description,
        category: body.category,
        severity: body.severity,
        location: body.location,
      },
      session.user.id,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json({ case: updatedCase });
  } catch (error) {
    console.error(`PATCH /api/cases/[id] error:`, error);

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cases/[id]
 * Delete case (only allowed for open/investigating cases)
 */
export async function DELETE(
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

    // Get reason from query params (optional)
    const { searchParams } = new URL(request.url);
    const reason = searchParams.get("reason");

    // Delete case
    await container.caseService.deleteCase(
      id,
      session.user.id,
      reason || undefined,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json(
      { message: "Case deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(`DELETE /api/cases/[id] error:`, error);

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

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

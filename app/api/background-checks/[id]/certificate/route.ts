/**
 * Background Check Certificate Generation API Route
 *
 * Endpoints:
 * POST /api/background-checks/[id]/certificate - Generate certificate
 *
 * Authentication: Required (NextAuth session)
 * Permissions: bgcheck:create (certificates)
 *
 * CRMS - Pan-African Digital Public Good
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { hasPermission } from "@/lib/permissions";
import { ValidationError, NotFoundError, ForbiddenError } from "@/src/lib/errors";

/**
 * POST /api/background-checks/[id]/certificate
 * Generate a certificate for visa or employer requests
 *
 * Request body:
 * {
 *   format?: "pdf" | "json" // Default: pdf
 * }
 *
 * Permissions: Officer or Admin
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check permissions
    if (!hasPermission(session, "bgcheck", "create", "station")) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions to generate certificates" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { format = "pdf" } = body;

    // Generate certificate
    const backgroundCheck = await container.backgroundCheckService.generateCertificate(
      {
        backgroundCheckId: id,
        format,
      },
      session.user.id
    );

    return NextResponse.json({
      backgroundCheck,
      certificateUrl: backgroundCheck.certificateUrl,
    });
  } catch (error) {
    console.error(`POST /api/background-checks/[id]/certificate error:`, error);

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

/**
 * USSD Officer Detail API Routes
 *
 * Endpoints:
 * GET /api/ussd-officers/[id] - Get officer USSD details
 * PATCH /api/ussd-officers/[id] - Update USSD settings
 *
 * Authentication: Required (NextAuth session)
 * Permissions: Admin only (canManageOfficers)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { canManageOfficers } from "@/lib/permissions";
import {
  ValidationError,
  NotFoundError,
} from "@/src/lib/errors";

/**
 * GET /api/ussd-officers/[id]
 * Get officer USSD details with query statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManageOfficers(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const prisma = container.prismaClient;

    // Fetch officer with USSD data
    const officer = await prisma.officer.findUnique({
      where: { id },
      include: {
        role: { select: { name: true, level: true } },
        station: { select: { code: true, name: true } },
        _count: {
          select: { ussdQueries: true },
        },
      },
    });

    if (!officer) {
      return NextResponse.json({ error: "Officer not found" }, { status: 404 });
    }

    // Calculate today's query count
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const queriesToday = await prisma.uSSDQueryLog.count({
      where: {
        officerId: id,
        timestamp: { gte: today },
      },
    });

    return NextResponse.json({
      officer: {
        id: officer.id,
        badge: officer.badge,
        name: officer.name,
        email: officer.email,
        phone: officer.phone,
        roleId: officer.roleId,
        roleName: officer.role.name,
        roleLevel: officer.role.level,
        stationId: officer.stationId,
        stationName: officer.station.name,
        stationCode: officer.station.code,
        ussdPhoneNumber: officer.ussdPhoneNumber,
        ussdEnabled: officer.ussdEnabled,
        ussdDailyLimit: officer.ussdDailyLimit,
        ussdRegisteredAt: officer.ussdRegisteredAt,
        ussdLastUsed: officer.ussdLastUsed,
        totalQueries: officer._count.ussdQueries,
        queriesToday,
      },
    });
  } catch (error) {
    const { id } = await params;
    console.error(`GET /api/ussd-officers/${id} error:`, error);

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ussd-officers/[id]
 * Update officer USSD settings
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManageOfficers(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { ussdPhoneNumber, ussdDailyLimit } = body;

    // Validate input
    if (ussdPhoneNumber && typeof ussdPhoneNumber !== "string") {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    if (ussdDailyLimit && (typeof ussdDailyLimit !== "number" || ussdDailyLimit < 1)) {
      return NextResponse.json(
        { error: "Daily limit must be a positive number" },
        { status: 400 }
      );
    }

    const prisma = container.prismaClient;

    // Update officer
    const updatedOfficer = await prisma.officer.update({
      where: { id },
      data: {
        ...(ussdPhoneNumber !== undefined && { ussdPhoneNumber }),
        ...(ussdDailyLimit !== undefined && { ussdDailyLimit }),
      },
      include: {
        role: { select: { name: true } },
        station: { select: { code: true, name: true } },
      },
    });

    // Audit log
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";

    await container.auditLogRepository.create({
      entityType: "officer",
      entityId: id,
      officerId: session.user.id,
      action: "update",
      success: true,
      details: {
        ussdPhoneNumber: ussdPhoneNumber !== undefined,
        ussdDailyLimit: ussdDailyLimit !== undefined,
      },
      ipAddress: ip,
    });

    return NextResponse.json({
      officer: {
        id: updatedOfficer.id,
        badge: updatedOfficer.badge,
        name: updatedOfficer.name,
        ussdPhoneNumber: updatedOfficer.ussdPhoneNumber,
        ussdDailyLimit: updatedOfficer.ussdDailyLimit,
        ussdEnabled: updatedOfficer.ussdEnabled,
      },
    });
  } catch (error) {
    const { id } = await params;
    console.error(`PATCH /api/ussd-officers/${id} error:`, error);

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

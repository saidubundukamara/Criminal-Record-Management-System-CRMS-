/**
 * Person API Routes
 *
 * GET  /api/persons - List/search persons with filters
 * POST /api/persons - Create a new person
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { hasPermission } from "@/lib/permissions";
import { PersonFilters } from "@/src/domain/interfaces/repositories/IPersonRepository";
import { CreatePersonInput } from "@/src/services/PersonService";
import { ValidationError, NotFoundError, ForbiddenError } from "@/src/lib/errors";

/**
 * GET /api/persons
 * List/search persons with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(session, "persons", "read", "station")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || undefined;
    const nin = searchParams.get("nin") || undefined;
    const gender = searchParams.get("gender") || undefined;
    const nationality = searchParams.get("nationality") || undefined;
    const riskLevel = searchParams.get("riskLevel") || undefined;
    const isWanted = searchParams.get("isWanted") === "true" ? true : undefined;
    const hasFingerprints = searchParams.get("hasFingerprints") === "true" ? true : undefined;
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build filters
    const filters: PersonFilters = {
      search,
      nin,
      gender: gender as any,
      nationality,
      riskLevel: riskLevel as any,
      isWanted,
      hasFingerprints,
      stationId: session.user.stationId, // Filter by user's station
    };

    // Get persons
    const { persons, total } = await container.personService.searchPersons(
      filters,
      session.user.id,
      limit,
      offset
    );

    return NextResponse.json(
      {
        persons: persons.map((p) => ({
          id: p.id,
          nin: p.nin,
          firstName: p.firstName,
          lastName: p.lastName,
          middleName: p.middleName,
          fullName: p.getFullName(),
          alias: p.alias,
          dateOfBirth: p.dateOfBirth,
          age: p.getAge(),
          gender: p.gender,
          nationality: p.nationality,
          riskLevel: p.riskLevel,
          isWanted: p.isWanted,
          isDeceasedOrMissing: p.isDeceasedOrMissing,
          hasFingerprints: p.hasBiometricData(),
          photoUrl: p.photoUrl,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
        total,
        limit,
        offset,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching persons:", error);

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
 * POST /api/persons
 * Create a new person
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(session, "persons", "create", "station")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Prepare input
    const input: CreatePersonInput = {
      ...body,
      stationId: session.user.stationId, // Use user's station
    };

    // Create person
    const person = await container.personService.createPerson(
      input,
      session.user.id,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json(
      {
        person: {
          id: person.id,
          nin: person.nin,
          firstName: person.firstName,
          lastName: person.lastName,
          middleName: person.middleName,
          fullName: person.getFullName(),
          alias: person.alias,
          dateOfBirth: person.dateOfBirth,
          age: person.getAge(),
          gender: person.gender,
          nationality: person.nationality,
          placeOfBirth: person.placeOfBirth,
          occupation: person.occupation,
          maritalStatus: person.maritalStatus,
          educationLevel: person.educationLevel,
          tribe: person.tribe,
          religion: person.religion,
          languagesSpoken: person.languagesSpoken,
          physicalDescription: person.physicalDescription,
          photoUrl: person.photoUrl,
          addresses: person.addresses,
          phoneNumbers: person.phoneNumbers,
          emails: person.emails,
          fingerprintHash: person.fingerprintHash,
          biometricHash: person.biometricHash,
          criminalHistory: person.criminalHistory,
          riskLevel: person.riskLevel,
          isWanted: person.isWanted,
          isDeceasedOrMissing: person.isDeceasedOrMissing,
          notes: person.notes,
          hasCompleteId: person.hasCompleteIdentification(),
          dataCompleteness: person.getDataCompletenessPercentage(),
          createdAt: person.createdAt,
          updatedAt: person.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating person:", error);

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

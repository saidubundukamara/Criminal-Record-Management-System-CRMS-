/**
 * USSD Callback Handler
 *
 * Main endpoint for Africa's Talking / Twilio USSD webhook
 * Handles all USSD interactions for officer field tools
 *
 * Flow:
 * 1. Parse webhook request (sessionId, phoneNumber, text)
 * 2. Get/create session
 * 3. Route based on menu level and authentication state
 * 4. Execute feature logic (leveraging existing services)
 * 5. Return CON (continue) or END (terminate) response
 *
 * Features:
 * - Wanted person check (by NIN)
 * - Missing person check (by NIN)
 * - Background summary (by NIN)
 * - Vehicle check (by license plate)
 * - Officer stats
 */

import { NextRequest, NextResponse } from "next/server";
import { container } from "@/src/di/container";
import { sessionManager, parseUSSDInput, getLastInput } from "@/lib/ussd-session";
import { authenticateQuickPin } from "@/lib/ussd-auth";
import { checkRateLimit, logQuery, getQueryStatistics } from "@/lib/ussd-rate-limit";

/**
 * POST /api/ussd/callback
 *
 * Webhook endpoint for USSD gateway
 * Public route (no authentication required - auth happens via Quick PIN)
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Parse webhook request
    const body = await request.formData();
    const sessionId = body.get("sessionId") as string;
    const phoneNumber = body.get("phoneNumber") as string;
    const text = (body.get("text") as string) || "";

    if (!sessionId || !phoneNumber) {
      return new NextResponse("END Invalid request", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Step 2: Get or create session
    let session = await sessionManager.getSession(sessionId);
    if (!session) {
      await sessionManager.saveSession(sessionId, {
        phoneNumber,
        currentMenu: "main",
        data: {},
      });
      session = await sessionManager.getSession(sessionId);
    }

    // Parse user input
    const inputs = parseUSSDInput(text);
    const lastInput = getLastInput(text);

    // Step 3: Route based on menu state
    let response: string;

    if (inputs.length === 0) {
      // Main menu
      response = handleMainMenu();
    } else if (inputs.length === 1) {
      // Feature selection
      response = await handleFeatureSelection(sessionId, phoneNumber, inputs[0]);
    } else if (inputs.length === 2) {
      // Authentication or input
      response = await handleAuthentication(sessionId, phoneNumber, inputs, lastInput!);
    } else if (inputs.length >= 3) {
      // Execute query
      response = await handleQuery(sessionId, phoneNumber, inputs);
    } else {
      response = "END Invalid selection";
    }

    return new NextResponse(response, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("[USSD Callback Error]", error);
    return new NextResponse("END Service temporarily unavailable", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

/**
 * Display main menu
 */
function handleMainMenu(): string {
  return (
    "CON CRMS Field Tools\n" +
    "1. Check wanted person\n" +
    "2. Check missing person\n" +
    "3. Background check\n" +
    "4. Check vehicle\n" +
    "5. My stats"
  );
}

/**
 * Handle feature selection and prompt for Quick PIN
 */
async function handleFeatureSelection(
  sessionId: string,
  phoneNumber: string,
  selection: string
): Promise<string> {
  const features: Record<string, string> = {
    "1": "wanted",
    "2": "missing",
    "3": "background",
    "4": "vehicle",
    "5": "stats",
  };

  const feature = features[selection];
  if (!feature) {
    return "END Invalid selection";
  }

  // Store selected feature in session
  await sessionManager.setData(sessionId, "feature", feature);

  return "CON Enter your 4-digit Quick PIN:";
}

/**
 * Handle authentication with Quick PIN
 */
async function handleAuthentication(
  sessionId: string,
  phoneNumber: string,
  inputs: string[],
  quickPin: string
): Promise<string> {
  // Authenticate officer
  const authResult = await authenticateQuickPin(phoneNumber, quickPin);

  if (!authResult.success) {
    await sessionManager.clearSession(sessionId);
    return `END ${authResult.error}`;
  }

  // Store officer data in session
  await sessionManager.authenticateSession(sessionId, authResult.officer!.id, authResult.officer);

  // Check rate limit
  const rateLimit = await checkRateLimit(authResult.officer!.id);
  if (!rateLimit.allowed) {
    await sessionManager.clearSession(sessionId);
    return `END Daily limit reached (${rateLimit.limit} queries).\nResets at midnight.`;
  }

  // Get selected feature
  const feature = await sessionManager.getData(sessionId, "feature");

  // Prompt for input based on feature
  if (feature === "stats") {
    // Stats doesn't need additional input - execute immediately
    return await executeStatsQuery(sessionId, authResult.officer!.id, phoneNumber);
  } else if (feature === "vehicle") {
    return "CON Enter license plate:";
  } else {
    // wanted, missing, background
    return "CON Enter NIN:";
  }
}

/**
 * Handle query execution
 */
async function handleQuery(
  sessionId: string,
  phoneNumber: string,
  inputs: string[]
): Promise<string> {
  // Get officer data from session
  const session = await sessionManager.getSession(sessionId);
  if (!session || !session.officerId) {
    await sessionManager.clearSession(sessionId);
    return "END Session expired. Please try again.";
  }

  const feature = await sessionManager.getData(sessionId, "feature");
  const searchTerm = inputs[inputs.length - 1];

  // Execute query based on feature
  let result: string;
  switch (feature) {
    case "wanted":
      result = await executeWantedCheck(session.officerId, searchTerm, phoneNumber, sessionId);
      break;
    case "missing":
      result = await executeMissingCheck(session.officerId, searchTerm, phoneNumber, sessionId);
      break;
    case "background":
      result = await executeBackgroundCheck(session.officerId, searchTerm, phoneNumber, sessionId);
      break;
    case "vehicle":
      result = await executeVehicleCheck(session.officerId, searchTerm, phoneNumber, sessionId);
      break;
    default:
      result = "END Invalid feature";
  }

  // Clear session after query
  await sessionManager.clearSession(sessionId);

  return result;
}

/**
 * Execute wanted person check
 */
async function executeWantedCheck(
  officerId: string,
  nin: string,
  phoneNumber: string,
  sessionId: string
): Promise<string> {
  try {
    // Find person by NIN using PersonRepository
    const person = await container.personRepository.findByNIN(nin);

    let resultSummary: string;
    let response: string;

    if (!person) {
      resultSummary = "NOT_FOUND";
      response = "END No record found for NIN: " + nin;
    } else {
      // Check if person has active wanted status
      const wantedPersons = await container.wantedPersonRepository.findByPersonId(person.id);
      const activeWanted = wantedPersons.find(wp => wp.status === "active");

      if (activeWanted) {
        resultSummary = "WANTED";
        response =
          "END ⚠️ WANTED PERSON\n" +
          `Name: ${person.firstName} ${person.lastName}\n` +
          `Charges: ${activeWanted.charges.join(", ")}\n` +
          `Danger: ${activeWanted.dangerLevel.toUpperCase()}\n` +
          `Warrant: ${activeWanted.warrantNumber || "N/A"}`;
      } else {
        resultSummary = "NOT_WANTED";
        response = "END ✓ No active warrants\n" + `Name: ${person.firstName} ${person.lastName}`;
      }
    }

    // Log query
    await logQuery({
      officerId,
      phoneNumber,
      queryType: "wanted",
      searchTerm: nin,
      resultSummary,
      success: true,
      sessionId,
    });

    return response;
  } catch (error) {
    console.error("[USSD Wanted Check Error]", error);
    await logQuery({
      officerId,
      phoneNumber,
      queryType: "wanted",
      searchTerm: nin,
      success: false,
      errorMessage: "Database error",
      sessionId,
    });
    return "END Error checking wanted status";
  }
}

/**
 * Execute missing person check
 */
async function executeMissingCheck(
  officerId: string,
  nin: string,
  phoneNumber: string,
  sessionId: string
): Promise<string> {
  try {
    // Find person by NIN using PersonRepository
    const person = await container.personRepository.findByNIN(nin);

    let resultSummary: string;
    let response: string;

    if (!person) {
      resultSummary = "NOT_FOUND";
      response = "END No record found for NIN: " + nin;
    } else if (person.isDeceasedOrMissing) {
      resultSummary = "MISSING";
      response =
        "END ⚠️ MISSING/DECEASED\n" +
        `Name: ${person.firstName} ${person.lastName}\n` +
        `Status: Missing or Deceased\n` +
        "Contact station for details";
    } else {
      resultSummary = "NOT_MISSING";
      response = "END ✓ Not reported missing\n" + `Name: ${person.firstName} ${person.lastName}`;
    }

    await logQuery({
      officerId,
      phoneNumber,
      queryType: "missing",
      searchTerm: nin,
      resultSummary,
      success: true,
      sessionId,
    });

    return response;
  } catch (error) {
    console.error("[USSD Missing Check Error]", error);
    await logQuery({
      officerId,
      phoneNumber,
      queryType: "missing",
      searchTerm: nin,
      success: false,
      errorMessage: "Database error",
      sessionId,
    });
    return "END Error checking missing status";
  }
}

/**
 * Execute background check
 */
async function executeBackgroundCheck(
  officerId: string,
  nin: string,
  phoneNumber: string,
  sessionId: string
): Promise<string> {
  try {
    // Find person by NIN using PersonRepository
    const person = await container.personRepository.findByNIN(nin);

    let resultSummary: string;
    let response: string;

    if (!person) {
      resultSummary = "NOT_FOUND";
      response = "END No record found for NIN: " + nin;
    } else {
      // Get person's case count using CaseRepository
      const cases = await container.caseRepository.findByPersonId(person.id);
      const criminalCases = cases.length;

      // Check wanted status
      const wantedPersons = await container.wantedPersonRepository.findByPersonId(person.id);
      const isWanted = wantedPersons.some(wp => wp.status === "active");
      const isMissing = person.isDeceasedOrMissing;

      if (criminalCases === 0 && !isWanted && !isMissing) {
        resultSummary = "CLEAR";
        response = "END ✓ CLEAR\n" + `Name: ${person.firstName} ${person.lastName}\n` + "No criminal record";
      } else {
        resultSummary = "HAS_RECORD";
        response =
          "END ⚠️ RECORD EXISTS\n" +
          `Name: ${person.firstName} ${person.lastName}\n` +
          `Cases: ${criminalCases}\n` +
          `Wanted: ${isWanted ? "YES" : "NO"}\n` +
          `Missing: ${isMissing ? "YES" : "NO"}`;
      }
    }

    await logQuery({
      officerId,
      phoneNumber,
      queryType: "background",
      searchTerm: nin,
      resultSummary,
      success: true,
      sessionId,
    });

    return response;
  } catch (error) {
    console.error("[USSD Background Check Error]", error);
    await logQuery({
      officerId,
      phoneNumber,
      queryType: "background",
      searchTerm: nin,
      success: false,
      errorMessage: "Database error",
      sessionId,
    });
    return "END Error performing background check";
  }
}

/**
 * Execute vehicle check
 */
async function executeVehicleCheck(
  officerId: string,
  licensePlate: string,
  phoneNumber: string,
  sessionId: string
): Promise<string> {
  try {
    // Find vehicle by license plate using VehicleRepository
    const vehicle = await container.vehicleRepository.findByLicensePlate(licensePlate.toUpperCase());

    let resultSummary: string;
    let response: string;

    if (!vehicle) {
      resultSummary = "NOT_FOUND";
      response = "END No record found for plate: " + licensePlate;
    } else if (vehicle.status === "stolen") {
      resultSummary = "STOLEN";
      response =
        "END ⚠️ STOLEN VEHICLE\n" +
        `Plate: ${vehicle.licensePlate}\n` +
        `Make: ${vehicle.make || "N/A"}\n` +
        `Model: ${vehicle.model || "N/A"}\n` +
        `Color: ${vehicle.color || "N/A"}\n` +
        `Stolen: ${vehicle.stolenDate ? new Date(vehicle.stolenDate).toLocaleDateString() : "Yes"}`;
    } else {
      resultSummary = "NOT_STOLEN";
      response =
        "END ✓ Not reported stolen\n" +
        `Plate: ${vehicle.licensePlate}\n` +
        `Make: ${vehicle.make || "N/A"}\n` +
        `Model: ${vehicle.model || "N/A"}`;
    }

    await logQuery({
      officerId,
      phoneNumber,
      queryType: "vehicle",
      searchTerm: licensePlate,
      resultSummary,
      success: true,
      sessionId,
    });

    return response;
  } catch (error) {
    console.error("[USSD Vehicle Check Error]", error);
    await logQuery({
      officerId,
      phoneNumber,
      queryType: "vehicle",
      searchTerm: licensePlate,
      success: false,
      errorMessage: "Database error",
      sessionId,
    });
    return "END Error checking vehicle status";
  }
}

/**
 * Execute stats query
 */
async function executeStatsQuery(
  sessionId: string,
  officerId: string,
  phoneNumber: string
): Promise<string> {
  try {
    const stats = await getQueryStatistics(officerId);

    const response =
      "END 📊 Your USSD Stats\n" +
      `Today: ${stats.today}\n` +
      `This week: ${stats.thisWeek}\n` +
      `This month: ${stats.thisMonth}\n` +
      `Total: ${stats.total}\n` +
      `Success rate: ${stats.successRate.toFixed(1)}%`;

    await logQuery({
      officerId,
      phoneNumber,
      queryType: "stats",
      searchTerm: "self",
      resultSummary: "SUCCESS",
      success: true,
      sessionId,
    });

    await sessionManager.clearSession(sessionId);

    return response;
  } catch (error) {
    console.error("[USSD Stats Error]", error);
    await logQuery({
      officerId,
      phoneNumber,
      queryType: "stats",
      searchTerm: "self",
      success: false,
      errorMessage: "Database error",
      sessionId,
    });
    return "END Error retrieving stats";
  }
}

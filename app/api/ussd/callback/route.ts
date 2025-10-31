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
 * 4. Execute feature logic (leveraging Phase 6 services)
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
import {
  sessionManager,
  parseUSSDInput,
  getMenuLevel,
} from "@/lib/ussd-session";
import {
  authenticateQuickPin,
  isValidQuickPin,
} from "@/lib/ussd-auth";
import {
  checkRateLimit,
  logQuery,
  getQueryStatistics,
} from "@/lib/ussd-rate-limit";
import { container } from "@/src/di/container";

/**
 * POST /api/ussd/callback
 *
 * Webhook endpoint for USSD gateway
 * Public route (no authentication required)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse form data from USSD gateway
    const formData = await request.formData();
    const sessionId = formData.get("sessionId") as string;
    const serviceCode = formData.get("serviceCode") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const text = (formData.get("text") as string) || "";

    console.log("[USSD Request]", {
      sessionId,
      phoneNumber,
      text,
      level: getMenuLevel(text),
    });

    // Get or create session
    let session = await sessionManager.getSession(sessionId);
    if (!session) {
      await sessionManager.saveSession(sessionId, {
        phoneNumber,
        currentMenu: "main",
        data: {},
      });
      session = await sessionManager.getSession(sessionId);
    }

    if (!session) {
      return new NextResponse("END Service temporarily unavailable.", {
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Parse input
    const inputs = parseUSSDInput(text);
    const level = inputs.length;

    let response = "";

    // Route based on menu level and state
    if (level === 0) {
      // Main menu (no input yet)
      response = buildMainMenu();
    } else if (level === 1 && !session.officerId) {
      // Feature selection -> prompt for authentication
      const choice = inputs[0];
      if (["1", "2", "3", "4", "5"].includes(choice)) {
        // Store feature selection
        await sessionManager.setData(sessionId, "feature", choice);
        response = "CON Enter 4-digit Quick PIN:";
      } else {
        response = "END Invalid option.";
      }
    } else if (level === 2 && !session.officerId) {
      // Authentication (Quick PIN entry)
      const quickPin = inputs[1];
      response = await handleAuthentication(
        sessionId,
        phoneNumber,
        quickPin,
        session.data.feature
      );
    } else if (session.officerId) {
      // Authenticated - route to features
      response = await handleAuthenticatedRequest(sessionId, inputs, session);
    } else {
      response = "END Invalid request.";
    }

    console.log("[USSD Response]", {
      sessionId,
      responseType: response.startsWith("END") ? "END" : "CON",
    });

    // Clear session if END response
    if (response.startsWith("END")) {
      await sessionManager.clearSession(sessionId);
    }

    return new NextResponse(response, {
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("[USSD Error]", error);
    return new NextResponse("END An error occurred. Please try again later.", {
      headers: { "Content-Type": "text/plain" },
    });
  }
}

/**
 * Build main menu (Level 0)
 */
function buildMainMenu(): string {
  return `CON CRMS Officer Portal
1. Wanted Person Check
2. Missing Person Check
3. Background Summary
4. Vehicle Check
5. My Stats`;
}

/**
 * Handle authentication (Quick PIN verification)
 */
async function handleAuthentication(
  sessionId: string,
  phoneNumber: string,
  quickPin: string,
  feature: string
): Promise<string> {
  // Validate Quick PIN format
  if (!isValidQuickPin(quickPin)) {
    await sessionManager.clearSession(sessionId);
    return "END Invalid PIN format. Must be 4 digits.";
  }

  // Authenticate
  const auth = await authenticateQuickPin(phoneNumber, quickPin);

  if (!auth.success) {
    await sessionManager.clearSession(sessionId);
    return `END ${auth.error}`;
  }

  // Check rate limit
  const rateLimit = await checkRateLimit(auth.officer!.id);

  if (!rateLimit.allowed) {
    await sessionManager.clearSession(sessionId);
    return `END Daily limit reached (${rateLimit.limit} queries).\nResets at midnight.`;
  }

  // Store officer in session
  await sessionManager.authenticateSession(sessionId, auth.officer!.id, {
    badge: auth.officer!.badge,
    name: auth.officer!.name,
    stationId: auth.officer!.stationId,
    stationName: auth.officer!.stationName,
    stationCode: auth.officer!.stationCode,
    ussdDailyLimit: auth.officer!.ussdDailyLimit,
  });

  // Route to feature prompt based on selection
  if (feature === "1") return "CON Enter NIN (11 digits):";
  if (feature === "2") return "CON Enter NIN (11 digits):";
  if (feature === "3") return "CON Enter NIN (11 digits):";
  if (feature === "4") return "CON Enter License Plate:";
  if (feature === "5") {
    // Stats doesn't need additional input
    return await handleStatsQuery(sessionId, auth.officer!.id);
  }

  return "END Invalid feature selection.";
}

/**
 * Handle authenticated requests (Level 3+)
 */
async function handleAuthenticatedRequest(
  sessionId: string,
  inputs: string[],
  session: any
): Promise<string> {
  const feature = session.data.feature;
  const searchTerm = inputs[inputs.length - 1]; // Last input is the search term

  if (feature === "1") {
    return await handleWantedCheck(sessionId, searchTerm, session.officerId);
  }
  if (feature === "2") {
    return await handleMissingCheck(sessionId, searchTerm, session.officerId);
  }
  if (feature === "3") {
    return await handleBackgroundCheck(
      sessionId,
      searchTerm,
      session.officerId
    );
  }
  if (feature === "4") {
    return await handleVehicleCheck(sessionId, searchTerm, session.officerId);
  }

  return "END Invalid request.";
}

/**
 * Feature 1: Wanted Person Check
 * Uses Phase 6 AlertService
 */
async function handleWantedCheck(
  sessionId: string,
  nin: string,
  officerId: string
): Promise<string> {
  // Validate NIN format (11 digits)
  if (!/^\d{11}$/.test(nin)) {
    await logQuery({
      officerId,
      phoneNumber: (await sessionManager.getSession(sessionId))?.phoneNumber || "",
      queryType: "wanted",
      searchTerm: nin,
      resultSummary: "INVALID_NIN",
      success: false,
      errorMessage: "Invalid NIN format",
      sessionId,
    });
    return "END Invalid NIN format.\nMust be 11 digits.";
  }

  try {
    // Get person by NIN
    const person = await container.personService.findByNIN(nin, officerId);

    if (!person) {
      await logQuery({
        officerId,
        phoneNumber: (await sessionManager.getSession(sessionId))?.phoneNumber || "",
        queryType: "wanted",
        searchTerm: nin,
        resultSummary: "NOT_FOUND",
        success: true,
        sessionId,
      });
      return `END NIN: ${nin}\nNo person found.`;
    }

    // Check if person is wanted (using Person.isWanted flag from Phase 6)
    if (!person.isWanted) {
      await logQuery({
        officerId,
        phoneNumber: (await sessionManager.getSession(sessionId))?.phoneNumber || "",
        queryType: "wanted",
        searchTerm: nin,
        resultSummary: "NOT_WANTED",
        success: true,
        sessionId,
      });
      return `END ${person.getFullName()}\nNIN: ${nin}\nSTATUS: NOT WANTED`;
    }

    // Get wanted person details from repository
    const wantedPersons = await container.wantedPersonRepository.findByPersonId(person.id);
    const wantedPerson = wantedPersons.find(wp => wp.status === 'active');

    if (!wantedPerson) {
      // Person flagged as wanted but no wanted record (data inconsistency)
      await logQuery({
        officerId,
        phoneNumber: (await sessionManager.getSession(sessionId))?.phoneNumber || "",
        queryType: "wanted",
        searchTerm: nin,
        resultSummary: "NOT_WANTED",
        success: true,
        sessionId,
      });
      return `END ${person.getFullName()}\nNIN: ${nin}\nSTATUS: NOT WANTED`;
    }

    // Log successful query
    await logQuery({
      officerId,
      phoneNumber: (await sessionManager.getSession(sessionId))?.phoneNumber || "",
      queryType: "wanted",
      searchTerm: nin,
      resultSummary: "WANTED",
      success: true,
      sessionId,
    });

    // Format charges (extract charge text from CriminalCharge objects)
    const chargeTexts = wantedPerson.charges.slice(0, 2).map(c => c.charge);
    const chargesDisplay = chargeTexts.join(", ");
    const chargesText = wantedPerson.charges.length > 2
      ? `${chargesDisplay}, +${wantedPerson.charges.length - 2} more`
      : chargesDisplay;

    // Return USSD-formatted response
    return `END ${person.getFullName()}
WANTED
Charges: ${chargesText}
Danger: ${wantedPerson.dangerLevel.toUpperCase()}
Warrant: ${wantedPerson.warrantNumber}
DETAIN & CALL STATION`;
  } catch (error) {
    console.error("[Wanted Check Error]", error);
    await logQuery({
      officerId,
      phoneNumber: (await sessionManager.getSession(sessionId))?.phoneNumber || "",
      queryType: "wanted",
      searchTerm: nin,
      resultSummary: "ERROR",
      success: false,
      errorMessage: "System error",
      sessionId,
    });
    return "END Error checking wanted status.\nTry again later.";
  }
}

/**
 * Feature 2: Missing Person Check
 * Uses Phase 6 AlertService
 */
async function handleMissingCheck(
  sessionId: string,
  nin: string,
  officerId: string
): Promise<string> {
  // Validate NIN format
  if (!/^\d{11}$/.test(nin)) {
    await logQuery({
      officerId,
      phoneNumber: (await sessionManager.getSession(sessionId))?.phoneNumber || "",
      queryType: "missing",
      searchTerm: nin,
      resultSummary: "INVALID_NIN",
      success: false,
      errorMessage: "Invalid NIN format",
      sessionId,
    });
    return "END Invalid NIN format.\nMust be 11 digits.";
  }

  try {
    // Get person by NIN
    const person = await container.personService.findByNIN(nin, officerId);

    if (!person) {
      await logQuery({
        officerId,
        phoneNumber: (await sessionManager.getSession(sessionId))?.phoneNumber || "",
        queryType: "missing",
        searchTerm: nin,
        resultSummary: "NOT_FOUND",
        success: true,
        sessionId,
      });
      return `END NIN: ${nin}\nNo person found.`;
    }

    // Get active amber alerts
    const alerts = await container.alertService.getActiveAmberAlerts();

    // Find alert for this person (by name matching since amber alerts may not have personId)
    const personName = person.getFullName().toLowerCase();
    const alert = alerts.find(
      (a) => a.personName.toLowerCase() === personName
    );

    if (!alert) {
      await logQuery({
        officerId,
        phoneNumber: (await sessionManager.getSession(sessionId))?.phoneNumber || "",
        queryType: "missing",
        searchTerm: nin,
        resultSummary: "NOT_MISSING",
        success: true,
        sessionId,
      });
      return `END ${person.getFullName()}\nNIN: ${nin}\nSTATUS: NOT REPORTED MISSING`;
    }

    // Log successful query
    await logQuery({
      officerId,
      phoneNumber: (await sessionManager.getSession(sessionId))?.phoneNumber || "",
      queryType: "missing",
      searchTerm: nin,
      resultSummary: "MISSING",
      success: true,
      sessionId,
    });

    // Calculate days missing
    const daysMissing = alert.lastSeenDate
      ? Math.floor(
          (Date.now() - alert.lastSeenDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      : null;

    // Return USSD-formatted response
    return `END ${alert.personName}
MISSING PERSON ALERT
Age: ${alert.age || "Unknown"}
Last seen: ${alert.lastSeenLocation || "Unknown"}
${daysMissing ? `${daysMissing} days ago` : ""}
Contact: ${alert.contactPhone}
CALL STATION IMMEDIATELY`;
  } catch (error) {
    console.error("[Missing Check Error]", error);
    await logQuery({
      officerId,
      phoneNumber: (await sessionManager.getSession(sessionId))?.phoneNumber || "",
      queryType: "missing",
      searchTerm: nin,
      resultSummary: "ERROR",
      success: false,
      errorMessage: "System error",
      sessionId,
    });
    return "END Error checking missing status.\nTry again later.";
  }
}

/**
 * Feature 3: Background Summary
 * Uses Phase 6 BackgroundCheckService
 */
async function handleBackgroundCheck(
  sessionId: string,
  nin: string,
  officerId: string
): Promise<string> {
  // Validate NIN format
  if (!/^\d{11}$/.test(nin)) {
    await logQuery({
      officerId,
      phoneNumber: (await sessionManager.getSession(sessionId))?.phoneNumber || "",
      queryType: "background",
      searchTerm: nin,
      resultSummary: "INVALID_NIN",
      success: false,
      errorMessage: "Invalid NIN format",
      sessionId,
    });
    return "END Invalid NIN format.\nMust be 11 digits.";
  }

  try {
    // Perform background check (officer request type = full details)
    const check = await container.backgroundCheckService.performBackgroundCheck({
      nin,
      requestType: "officer",
      requestedById: officerId,
    });

    // Log query
    await logQuery({
      officerId,
      phoneNumber: (await sessionManager.getSession(sessionId))?.phoneNumber || "",
      queryType: "background",
      searchTerm: nin,
      resultSummary: check.result.status.toUpperCase(),
      success: true,
      sessionId,
    });

    // Check if person was found
    if (check.result.status === "clear") {
      return `END NIN: ${nin}\nNo criminal record found.\nStatus: CLEAR`;
    }

    // For officer requests, we have criminalHistory in the result
    const recordsCount = check.result.recordsCount || 0;
    const riskLevel = check.result.riskLevel || "unknown";

    // Get person details
    const person = await container.personService.findByNIN(nin, officerId);
    if (!person) {
      return `END NIN: ${nin}\nRecord found but person details unavailable.`;
    }

    const isWanted = person.isWanted ? "YES" : "NO";

    return `END ${person.getFullName()}
NIN: ${nin}
Risk Level: ${riskLevel.toUpperCase()}
Cases: ${recordsCount}
Wanted: ${isWanted}
Use web app for full details`;
  } catch (error) {
    console.error("[Background Check Error]", error);
    await logQuery({
      officerId,
      phoneNumber: (await sessionManager.getSession(sessionId))?.phoneNumber || "",
      queryType: "background",
      searchTerm: nin,
      resultSummary: "ERROR",
      success: false,
      errorMessage: "System error",
      sessionId,
    });
    return "END Error performing background check.\nTry again later.";
  }
}

/**
 * Feature 4: Vehicle Check
 * Uses Phase 7 VehicleService
 */
async function handleVehicleCheck(
  sessionId: string,
  licensePlate: string,
  officerId: string
): Promise<string> {
  // Basic validation (3-12 alphanumeric)
  const normalized = licensePlate.toUpperCase().replace(/\s+/g, "");
  if (!/^[A-Z0-9]{3,12}$/.test(normalized)) {
    await logQuery({
      officerId,
      phoneNumber: (await sessionManager.getSession(sessionId))?.phoneNumber || "",
      queryType: "vehicle",
      searchTerm: licensePlate,
      resultSummary: "INVALID_PLATE",
      success: false,
      errorMessage: "Invalid license plate format",
      sessionId,
    });
    return "END Invalid license plate format.";
  }

  try {
    // Check vehicle using VehicleService
    const vehicle = await container.vehicleService.checkVehicle(
      normalized,
      officerId
    );

    if (!vehicle) {
      await logQuery({
        officerId,
        phoneNumber: (await sessionManager.getSession(sessionId))?.phoneNumber || "",
        queryType: "vehicle",
        searchTerm: licensePlate,
        resultSummary: "NOT_FOUND",
        success: true,
        sessionId,
      });
      return `END Plate: ${normalized}\nNot found in database.`;
    }

    // Log query
    await logQuery({
      officerId,
      phoneNumber: (await sessionManager.getSession(sessionId))?.phoneNumber || "",
      queryType: "vehicle",
      searchTerm: licensePlate,
      resultSummary: vehicle.status.toUpperCase(),
      success: true,
      sessionId,
    });

    // Return USSD-formatted summary
    return `END ${vehicle.getUSSDSummary()}`;
  } catch (error) {
    console.error("[Vehicle Check Error]", error);
    await logQuery({
      officerId,
      phoneNumber: (await sessionManager.getSession(sessionId))?.phoneNumber || "",
      queryType: "vehicle",
      searchTerm: licensePlate,
      resultSummary: "ERROR",
      success: false,
      errorMessage: "System error",
      sessionId,
    });
    return "END Error checking vehicle.\nTry again later.";
  }
}

/**
 * Feature 5: Officer Stats
 */
async function handleStatsQuery(
  sessionId: string,
  officerId: string
): Promise<string> {
  try {
    const stats = await getQueryStatistics(officerId);
    const session = await sessionManager.getSession(sessionId);
    const officer = session?.data.officer;

    // Log query
    await logQuery({
      officerId,
      phoneNumber: session?.phoneNumber || "",
      queryType: "stats",
      searchTerm: "self",
      resultSummary: `${stats.today} queries today`,
      success: true,
      sessionId,
    });

    const lastUsed = stats.lastQuery
      ? new Date(stats.lastQuery).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Never";

    return `END Officer: ${officer?.badge || "N/A"}
Station: ${officer?.stationName || "N/A"}
Today: ${stats.today}/${officer?.ussdDailyLimit || 50}
This week: ${stats.thisWeek}
This month: ${stats.thisMonth}
Last query: ${lastUsed}`;
  } catch (error) {
    console.error("[Stats Query Error]", error);
    return "END Error retrieving statistics.";
  }
}

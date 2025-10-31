/**
 * USSD Session Management
 *
 * Manages stateful sessions for USSD interactions which are inherently stateless.
 * Each USSD request is independent, so we need to track:
 * - Current menu position
 * - User authentication state
 * - Partial form data
 * - Last activity timestamp
 *
 * Production: Use Redis for distributed session storage
 * Development: Use in-memory Map (data lost on restart)
 *
 * Session Lifecycle:
 * - Created on first USSD request
 * - Updated on each subsequent request
 * - Auto-expire after 3 minutes of inactivity (USSD standard)
 * - Manually cleared on session end (END response)
 */

/**
 * USSD Session Data Structure
 */
export interface USSDSession {
  sessionId: string; // From Africa's Talking/Twilio
  phoneNumber: string;
  officerId?: string; // Set after authentication
  currentMenu: string; // Current menu state (e.g., "main", "wanted_check", "pin_entry")
  data: Record<string, any>; // Menu-specific data (feature selection, partial inputs, etc.)
  lastActivity: Date;
  createdAt: Date;
}

/**
 * Session Manager Class
 * Handles session CRUD operations with TTL support
 */
export class USSDSessionManager {
  private sessions: Map<string, USSDSession> = new Map();
  private readonly TTL = 180000; // 3 minutes in milliseconds (USSD standard timeout)

  /**
   * Save or update session
   * Merges provided data with existing session if it exists
   */
  async saveSession(
    sessionId: string,
    data: Partial<Omit<USSDSession, "sessionId" | "createdAt">>
  ): Promise<void> {
    const existing = this.sessions.get(sessionId);

    if (existing) {
      // Update existing session
      this.sessions.set(sessionId, {
        ...existing,
        ...data,
        sessionId, // Ensure sessionId doesn't change
        createdAt: existing.createdAt, // Preserve creation time
        lastActivity: new Date(),
      });
    } else {
      // Create new session
      this.sessions.set(sessionId, {
        sessionId,
        phoneNumber: data.phoneNumber || "",
        officerId: data.officerId,
        currentMenu: data.currentMenu || "main",
        data: data.data || {},
        lastActivity: new Date(),
        createdAt: new Date(),
      });
    }

    // Production: Implement Redis storage here
    // await redis.setex(`ussd:session:${sessionId}`, Math.floor(this.TTL / 1000), JSON.stringify(session));
  }

  /**
   * Get session by ID
   * Returns null if session doesn't exist or has expired
   */
  async getSession(sessionId: string): Promise<USSDSession | null> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    // Check if session has expired
    const age = Date.now() - session.lastActivity.getTime();
    if (age > this.TTL) {
      // Session expired, remove it
      this.sessions.delete(sessionId);
      return null;
    }

    return session;

    // Production: Implement Redis retrieval here
    // const data = await redis.get(`ussd:session:${sessionId}`);
    // if (!data) return null;
    // return JSON.parse(data);
  }

  /**
   * Update session with partial data
   * Convenience method for updating specific fields
   */
  async updateSession(
    sessionId: string,
    updates: Partial<Omit<USSDSession, "sessionId" | "createdAt">>
  ): Promise<void> {
    const existing = await this.getSession(sessionId);

    if (!existing) {
      throw new Error(`Session ${sessionId} not found`);
    }

    await this.saveSession(sessionId, {
      ...existing,
      ...updates,
    });
  }

  /**
   * Clear session
   * Called when session ends (END response sent)
   */
  async clearSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);

    // Production: Implement Redis deletion here
    // await redis.del(`ussd:session:${sessionId}`);
  }

  /**
   * Set officer ID after authentication
   */
  async authenticateSession(
    sessionId: string,
    officerId: string,
    officerData?: Record<string, any>
  ): Promise<void> {
    await this.updateSession(sessionId, {
      officerId,
      data: {
        ...(await this.getSession(sessionId))?.data,
        officer: officerData,
      },
    });
  }

  /**
   * Update current menu state
   */
  async setMenu(sessionId: string, menu: string): Promise<void> {
    await this.updateSession(sessionId, {
      currentMenu: menu,
    });
  }

  /**
   * Store data in session
   * Merges with existing data
   */
  async setData(
    sessionId: string,
    key: string,
    value: any
  ): Promise<void> {
    const session = await this.getSession(sessionId);

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    await this.updateSession(sessionId, {
      data: {
        ...session.data,
        [key]: value,
      },
    });
  }

  /**
   * Get data from session
   */
  async getData(sessionId: string, key: string): Promise<any> {
    const session = await this.getSession(sessionId);
    return session?.data?.[key];
  }

  /**
   * Check if session is authenticated
   */
  async isAuthenticated(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    return !!session?.officerId;
  }

  /**
   * Get officer ID from session
   */
  async getOfficerId(sessionId: string): Promise<string | null> {
    const session = await this.getSession(sessionId);
    return session?.officerId || null;
  }

  /**
   * Cleanup expired sessions
   * Call this periodically (e.g., every 5 minutes) to free memory
   */
  async cleanupExpiredSessions(): Promise<number> {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      const age = now - session.lastActivity.getTime();
      if (age > this.TTL) {
        this.sessions.delete(sessionId);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get session count (for monitoring)
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Get all active sessions (for admin/debugging)
   * WARNING: Use with caution in production
   */
  getAllSessions(): USSDSession[] {
    return Array.from(this.sessions.values());
  }
}

/**
 * Singleton session manager instance
 * Import and use this throughout your USSD application
 */
export const sessionManager = new USSDSessionManager();

/**
 * Start periodic cleanup (every 5 minutes)
 * Call this in your application startup
 */
export function startSessionCleanup(): void {
  setInterval(async () => {
    const cleaned = await sessionManager.cleanupExpiredSessions();
    if (cleaned > 0) {
      console.log(`[USSD Sessions] Cleaned up ${cleaned} expired sessions`);
    }
  }, 5 * 60 * 1000); // 5 minutes
}

/**
 * Helper: Parse USSD input chain
 * USSD inputs are delimited by asterisks (*)
 * Example: "1*2325678901" -> ["1", "2325678901"]
 */
export function parseUSSDInput(text: string): string[] {
  if (!text || text.trim() === "") {
    return [];
  }
  return text.split("*").filter((part) => part.trim() !== "");
}

/**
 * Helper: Get menu level from input
 * Level 0 = Main menu (no input)
 * Level 1 = Feature selection (e.g., "1")
 * Level 2 = First parameter (e.g., "1*1234")
 * etc.
 */
export function getMenuLevel(text: string): number {
  return parseUSSDInput(text).length;
}

/**
 * Helper: Get last input from USSD chain
 * Example: "1*2*12345678" -> "12345678"
 */
export function getLastInput(text: string): string | null {
  const inputs = parseUSSDInput(text);
  return inputs.length > 0 ? inputs[inputs.length - 1] : null;
}

/**
 * Helper: Get first input from USSD chain
 * Example: "1*2*12345678" -> "1"
 */
export function getFirstInput(text: string): string | null {
  const inputs = parseUSSDInput(text);
  return inputs.length > 0 ? inputs[0] : null;
}

/**
 * Stackra file contract:
 * Purpose: `IdpSession`, one live identity provider session of a user as `IdpAdmin.listSessions` answers it: its id,
 *          when it started and was last used, and the device's own description of itself, so a security page can list
 *          "where you are signed in" and end one.
 * Boundary: a type only. It holds no token and no IP address; the user agent is the device's self-description, shown
 *           as is and never trusted.
 * Runtime: isomorphic
 * Governing contract: ADR 0206; STA-1580.
 */

/** One live provider session. */
export interface IdpSession {
  /** The provider's session id. */
  readonly sessionId: string;

  /** When the session started, ISO 8601. */
  readonly createdAt: string;

  /** When the session last changed (a check or a refresh), ISO 8601. */
  readonly lastActiveAt: string;

  /** The device's description of itself (browser and OS), when the provider has one. */
  readonly userAgent?: string;
}

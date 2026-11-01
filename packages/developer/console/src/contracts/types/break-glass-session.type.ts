/**
 * Stackra file contract:
 * Purpose: `BreakGlassSession`, an operator's open emergency session: who opened it, why, and when it ends.
 * Boundary: a type only; the session is opened, approved and audited by the host's IAM service (ADR 0208 decision 3,
 *           `breakGlassGrant` of `@stackra/iam`), and the console only reads whether one is open.
 * Runtime: isomorphic
 * Governing contract: STA-1731 spec FR-018; ADR 0188 (SC12).
 */

/** An open break-glass session. */
export interface BreakGlassSession {
  /** The session's id, written into each audit entry it covers. */
  readonly id: string;

  /** The operator it was opened for. */
  readonly operator: string;

  /** Why it was opened. */
  readonly reason: string;

  /** When it ends; a session past this is closed. */
  readonly expiresAt: Date;
}

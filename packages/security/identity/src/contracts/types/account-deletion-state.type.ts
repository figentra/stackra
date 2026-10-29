/**
 * Stackra file contract:
 * Purpose: `AccountDeletionState`, what the account deletion calls answer the signed-in user and what the client hooks
 *          hold: when the deletion was asked and when it happens, both null when none is scheduled.
 * Boundary: a type only; times are ISO 8601 strings, as they cross the wire. Nothing names another account.
 * Runtime: isomorphic
 * Governing contract: App Store Review Guideline 5.1.1(v); STA-1567.
 */

/**
 * The caller's account deletion, if any.
 *
 * @example
 * const state: AccountDeletionState = { requestedAt: "2026-10-29T09:00:00.000Z", dueAt: "2026-11-28T09:00:00.000Z" };
 */
export interface AccountDeletionState {
  /** When the deletion was asked; null when none is scheduled. */
  readonly requestedAt: string | null;

  /** When the account is deleted; null when none is scheduled. */
  readonly dueAt: string | null;
}

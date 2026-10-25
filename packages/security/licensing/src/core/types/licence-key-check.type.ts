/**
 * Stackra file contract:
 * Purpose: `LicenceKeyCheck`, Keygen's answer to the opt-in online key check: valid or not, its code and its detail.
 * Boundary: a type only; the `meta` of Keygen's `validate-key` response, nothing else.
 * Runtime: isomorphic
 * Governing contract: ADR 0178 (decision 5).
 */

/** The verdict of one online check. */
export interface LicenceKeyCheck {
  /** Whether Keygen holds the key valid for the given scope. */
  readonly valid: boolean;

  /** Keygen's validation code (`VALID`, `EXPIRED`, `SUSPENDED`, `NOT_FOUND`, `TOO_MANY_MACHINES`, ...). */
  readonly code: string;

  /** Keygen's human-readable detail (`is valid`, `is expired`). */
  readonly detail: string;
}

/**
 * Stackra file contract:
 * Purpose: `ShowSecondScreenInput`, what the renderer sends `ShowSecondScreenBridge`: the route to show on the second
 *          display, or null to close it.
 * Boundary: a type only; the bridge re-checks it, because it crosses from the renderer.
 * Runtime: isomorphic
 * Governing contract: ADR 0251 (decisions 1 and 2); ADR 0339 (open question 3).
 */

/** The second screen's input. */
export interface ShowSecondScreenInput {
  /** A path of the app (`/customer-display`), or null to close the window. */
  readonly route: string | null;
}

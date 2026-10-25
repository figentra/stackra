/**
 * Stackra file contract:
 * Purpose: `SetKioskModeInput`, what the renderer sends `SetKioskModeBridge`: whether kiosk mode should be on.
 * Boundary: a type only; the bridge re-checks it, because it crosses from the renderer. Who may switch it (a manager
 *           override) is the renderer's action and its permission, not this bridge.
 * Runtime: isomorphic
 * Governing contract: ADR 0251 (decisions 1 and 2); ADR 0281 (kiosk launch mode).
 */

/** The kiosk switch's input. */
export interface SetKioskModeInput {
  /** True to enter kiosk mode, false to leave it. */
  readonly active: boolean;
}

/**
 * Stackra file contract:
 * Purpose: `OfflineCap`, the ceiling of an action's `offline.cap`: how many calls, or how much amount, one device may
 *          apply within a window, so an action that costs real money offline has a limit.
 * Boundary: a type only, copied by gen into the clients' offline map with the rest of `offline`. The client refuses
 *           the call offline once the cap is reached; the pipeline reconciles the device's replayed calls against the
 *           same cap and refuses beyond it with `offline_cap_reached`. Both sides read the amount from the input's
 *           `amount` field: a number of minor units, or a Money's wire form `{ minor, currency }`.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 5: `offline: { cap: { count, amount, window } }`).
 */

/** A per-device ceiling on an offline action. */
export interface OfflineCap {
  /** The most calls one device may apply within the window, a whole number from 1. */
  readonly count?: number;

  /** The most of the inputs' `amount`, in minor units, one device may apply within the window, from 1. */
  readonly amount?: number;

  /** The window, as a duration (`"24h"`). */
  readonly window: string;
}

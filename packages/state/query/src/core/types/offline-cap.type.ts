/**
 * Stackra file contract:
 * Purpose: `OfflineCap`, the cap of an action's `offline:` option (ADR 0338 decision 5): at most `count` calls, or at
 *          most `amount` in minor units, within `window`, after which the client refuses the action offline.
 * Boundary: a type only, read by `MutationQueue.enqueue` from the offline map. The amount is summed from each call's
 *           input `amount` (a `Money` wire form `{ minor, currency }` or minor units as a number).
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 5); ADR 0252 (decision 2: the `offline` option).
 */

// shortcut: a local structural type until `@stackra/actions`' `OfflineOptions` declares `cap` (W9-C2); then
// `OfflineEntry` inherits it and this file goes.
/**
 * An offline cap.
 *
 * @example
 * { count: 3, amount: 50_000, window: "24h" } // three redemptions or 500.00, whichever first, per day
 */
export interface OfflineCap {
  /** Calls allowed offline within the window; no count limit when absent. */
  readonly count?: number;

  /** Total of the calls' input `amount`, in minor units, allowed offline within the window; none when absent. */
  readonly amount?: number;

  /** The window, as a duration (`"24h"`). */
  readonly window: string;
}

/**
 * Stackra file contract:
 * Purpose: `OfflineCap`, the cap of an action's `offline:` option (ADR 0338 decision 5) as the mutation queue reads it:
 *          at most `count` calls, or at most `amount` in minor units, within `window`, after which the client refuses
 *          the action offline.
 * Boundary: a type only: @stackra/actions' `OfflineCap`, which now declares the `amountField` its pipeline reads, so the
 *           client and the server cap the same field (`amount` when absent). Kept under this name so the entry's
 *           consumers do not change.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 5); ADR 0252 (decision 2: the `offline` option).
 */
import type { OfflineCap as ActionOfflineCap } from "@stackra/actions";

/**
 * An offline cap.
 *
 * @example
 * { count: 3, amount: 50_000, window: "24h" } // three redemptions or 500.00, whichever first, per day
 */
export type OfflineCap = ActionOfflineCap;

/**
 * Stackra file contract:
 * Purpose: the `RateSource` port: the rate of a pair at an instant, for currency conversion and for the daily metal
 *          rate that formula prices read. The driver per market (a central bank feed, a metal-rate feed) is chosen by
 *          the market pack's rate-source key, never by code.
 * Boundary: an abstract class that is its own token, keyed `money.RateSource`. It answers a `RateSnapshot`; the caller
 *           keeps that snapshot with the cart or quote, so a later price never re-reads the feed. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0220 (decisions 1 and 3); ADR 0244 (decision 9); ADR 0294 (decisions 15, 16 and 17).
 */
import { Port } from "@stackra/contracts";

import type { RatePair } from "#contracts/types/rate-pair.type";
import type { RateSnapshot } from "#contracts/types/rate-snapshot.type";

/**
 * Answers exchange rates between currencies.
 *
 * @example
 * const snapshot = await rates.rate({ base: "XAU", quote: "SAR", unit: "gram" }, clock.now());
 * cart.rates.push(snapshot);
 */
export abstract class RateSource extends Port {
  /** Type-only port key, so `DriverName<RateSource>` narrows to this port's drivers. */
  declare readonly "~key": "money.RateSource";

  /**
   * The latest rate of `pair` that holds at or before `at`.
   *
   * @throws RangeError when the source has no rate for the pair at or before `at`; never an older guess.
   */
  abstract rate(pair: RatePair, at: Date): Promise<RateSnapshot>;
}

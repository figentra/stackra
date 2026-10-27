/**
 * Stackra file contract:
 * Purpose: the `BaggingScale` port: the scale under the bagging area of a self-checkout lane. It reads the weight in
 *          the bags now, streams every change (the lane compares it with what was scanned), zeroes the area at the
 *          start of a session (empty bags, a shopper's own bag), and answers a probe, each as a `CapabilityResult`
 *          that refuses with capability `serial` when no bagging scale answers.
 * Boundary: an abstract class that is its own token, keyed `peripherals.BaggingScale`. Hardware only: the expected
 *           weight, the tolerance and what a mismatch does (pause the lane, raise an intervention) are the product's
 *           rule set, never this port's. Only the `memory` driver ships; a lane vendor's driver needs its own ADR.
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (decisions 1 to 3); ADR 0250 (decision 3); ADR 0294 (decisions 15 and 16); STA-965.
 */
import { Port } from "@stackra/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";

import type { ScaleReading } from "#contracts/types/scale-reading.type";

/**
 * The self-checkout bagging scale.
 *
 * @example
 * await bagging.zero(); // a new session, the shopper's own bag on it
 * const stop = bagging.onWeight((reading) => lane.checkBag(reading));
 */
export abstract class BaggingScale extends Port {
  /** Type-only port key. */
  declare readonly "~key": "peripherals.BaggingScale";

  /** Whether a bagging scale answers now. */
  abstract probe(): Promise<CapabilityResult>;

  /** The net weight in the bagging area now. */
  abstract read(): Promise<CapabilityResult<ScaleReading>>;

  /** Zeroes the bagging area: what lies in it now reads as nothing from here on. */
  abstract zero(): Promise<CapabilityResult>;

  /** Calls `listener` with each new weight, settled or not, until the returned function stops it. */
  abstract onWeight(listener: (reading: ScaleReading) => void): () => void;
}

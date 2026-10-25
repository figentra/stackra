/**
 * Stackra file contract:
 * Purpose: `MemoryRateSourceDriver`, the `RateSource` driver that answers from snapshots a test or a local run puts in
 *          `snapshots`: the `memory` candidate, so pricing and conversion are testable before a feed is connected.
 * Boundary: no network. It answers the latest snapshot of the pair at or before the asked instant, and refuses with a
 *           `RangeError` when there is none, as a real source does. The constructor takes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers); ADR 0220 (decision 3).
 */
import { Driver } from "@stackra/container";

import { RateSource } from "#contracts/ports/rate-source.port";
import type { RatePair } from "#contracts/types/rate-pair.type";
import type { RateSnapshot } from "#contracts/types/rate-snapshot.type";

/**
 * Rates in memory.
 *
 * @example
 * const rates = new MemoryRateSourceDriver();
 * rates.snapshots.push({ base: "XAU", quote: "SAR", unit: "gram", rate: "251.42", source: "memory", at });
 * await rates.rate({ base: "XAU", quote: "SAR", unit: "gram" }, at);
 */
export class MemoryRateSourceDriver extends Driver(RateSource) {
  /** The rates it knows, in any order. */
  readonly snapshots: RateSnapshot[] = [];

  /**
   * The latest snapshot of `pair` at or before `at`.
   *
   * @throws RangeError when there is none.
   */
  async rate(pair: RatePair, at: Date): Promise<RateSnapshot> {
    let latest: RateSnapshot | undefined;
    for (const snapshot of this.snapshots)
      if (
        snapshot.base === pair.base &&
        snapshot.quote === pair.quote &&
        snapshot.unit === pair.unit &&
        snapshot.at.getTime() <= at.getTime() &&
        (latest === undefined || snapshot.at.getTime() > latest.at.getTime())
      )
        latest = snapshot;
    if (latest === undefined)
      throw new RangeError(
        `RateSource: no ${pair.base}${pair.unit === null ? "" : `/${pair.unit}`} in ${pair.quote} at or before ${at.toISOString()}`,
      );
    return latest;
  }
}

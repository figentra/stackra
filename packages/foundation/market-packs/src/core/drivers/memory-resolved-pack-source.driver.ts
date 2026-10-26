/**
 * Stackra file contract:
 * Purpose: `MemoryResolvedPackSourceDriver`, the `ResolvedPackSource` over pack versions handed to it (driver name
 *          `memory`): a test, a fixture or a tool that already holds verified packs.
 * Boundary: holds what it is given, unchecked: the caller verified the packs (`verifyPack`, `fetchPacks`) or built
 *           them as fixtures. Never use it to serve packs read from outside the process; that is the `store` driver.
 * Runtime: isomorphic
 * Governing contract: ADR 0418; ADR 0266 (decision 2: a memory driver ships with the production one).
 */
import { Driver } from "@stackra/container";

import { ResolvedPackSource } from "#core/ports/resolved-pack-source.port";
import type { MarketPack } from "#core/types/market-pack.type";

/**
 * Serves the packs it holds.
 *
 * @example
 * const source = new MemoryResolvedPackSourceDriver([us, usCa]);
 * await source.valueFor("us-ca", "billing.price_currency", { statuses: [PackStatus.Draft] });
 */
export class MemoryResolvedPackSourceDriver extends Driver(ResolvedPackSource) {
  /** The pack versions served. */
  private readonly held: readonly MarketPack[];

  /** @param packs - the verified pack versions to serve; copied. */
  constructor(packs: readonly MarketPack[] = []) {
    super();
    this.held = Object.freeze([...packs]);
  }

  /** The held packs. */
  async packs(): Promise<readonly MarketPack[]> {
    return this.held;
  }
}

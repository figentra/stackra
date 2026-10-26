/**
 * Stackra file contract:
 * Purpose: `ResolvedPackSource`, the injectable source of a deployment's verified market packs: `packs()` gives every
 *          pack version the deployment trusts, `valueFor(market, key)` answers "the value of X for market M today"
 *          (or on a given day, under a tenant's pins and sections) from them.
 * Boundary: an abstract class that is its own token, key `market_packs.ResolvedPackSource`. A driver only supplies
 *           `packs()`: the memory driver (packs handed to it), the `store` driver (the configured hashes fetched from
 *           `PackStore` and verified against the configured trusted keys); the OS loader (STA-763) is a later driver.
 *           `valueFor` resolves with `resolvePack` and reads with `valueOf`, so every driver answers alike; it passes
 *           on `PackNotFoundError` and `PackRejectedError`.
 * Runtime: isomorphic
 * Governing contract: ADR 0418 (the resolved-pack source); ADR 0370 (decisions 2, 4, 5 and 7); ADR 0385; ADR 0294
 *                     (decision 16: ports and drivers).
 */
import { Port } from "@stackra/contracts";

import { resolvePack } from "#core/functions/resolve-pack.function";
import { valueOf } from "#core/functions/value-of.function";
import type { MarketPack } from "#core/types/market-pack.type";
import type { ResolvedValue } from "#core/types/resolved-value.type";
import type { ValueForOptions } from "#core/types/value-for-options.type";

/**
 * The deployment's verified packs.
 *
 * @example
 * constructor(packs: ResolvedPackSource) { ... }
 * const currency = (await packs.valueFor(tenant.market, "billing.price_currency"))?.value;
 */
export abstract class ResolvedPackSource extends Port {
  /** Type-only port key. */
  declare readonly "~key": "market_packs.ResolvedPackSource";

  /** Every verified pack version of the deployment. */
  abstract packs(): Promise<readonly MarketPack[]>;

  /**
   * The value of `key` for `market`, in force on `options.on` (today, UTC, when left out); `undefined` when no layer
   * has it that day.
   *
   * @throws PackNotFoundError, PackRejectedError from `resolvePack`.
   */
  async valueFor(
    market: string,
    key: string,
    options: ValueForOptions = {},
  ): Promise<ResolvedValue | undefined> {
    const on = options.on ?? new Date().toISOString().slice(0, 10);
    return valueOf(resolvePack(await this.packs(), market, options), key, on);
  }
}

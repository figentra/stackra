/**
 * Stackra file contract:
 * Purpose: `ResolvedPackSource`, the injectable source of a deployment's verified market packs: `packs()` gives every
 *          pack version the deployment trusts, `valueFor(market, key)` answers "the value of X for market M today"
 *          (or on a given day, under a tenant's pins and sections) from them, and `sectionFor(market, Section)` reads
 *          a whole typed section (a `Schema` class with a `packPrefix`) in one resolve (STA-1726).
 * Boundary: an abstract class that is its own token, key `market_packs.ResolvedPackSource`. A driver only supplies
 *           `packs()`: the memory driver (packs handed to it), the `store` driver (the configured hashes fetched from
 *           `PackStore` and verified against the configured trusted keys); the OS loader (STA-763) is a later driver.
 *           `valueFor` and `sectionFor` resolve with `resolvePack` and read with `valueOf`, so every driver answers
 *           alike; they pass on `PackNotFoundError` and `PackRejectedError`. A section value that fails its schema
 *           throws from `create`: pack values are checked at signing, so that is a deployment fault.
 * Runtime: isomorphic
 * Governing contract: ADR 0418 (the resolved-pack source); ADR 0370 (decisions 2, 4, 5 and 7); ADR 0385; ADR 0294
 *                     (decision 16: ports and drivers).
 */
import { Port } from "@stackra/contracts";
import { snakeCase } from "@stackra/support";
import type { Fields, Schema } from "@stackra/validation";
import { schemaOf } from "@stackra/validation";
import { z } from "zod";

import { resolvePack } from "#core/functions/resolve-pack.function";
import { valueOf } from "#core/functions/value-of.function";
import type { MarketPack } from "#core/types/market-pack.type";
import type { PackSection } from "#core/types/pack-section.type";
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

  /**
   * The section `section` names for `market`, in force on `options.on` (today, UTC, when left out): each field is the
   * value of `<section.packPrefix>.<snake_case(field)>`, and a key no layer has that day takes the field's default.
   *
   * @throws PackNotFoundError, PackRejectedError from `resolvePack`.
   * @throws the schema's validation error when a value fails the section's schema.
   * @example
   * const dunning = await packs.sectionFor(tenant.market, DunningDefaults); // DunningDefaults.packPrefix = "billing.dunning"
   */
  async sectionFor<S extends Schema>(
    market: string,
    section: PackSection<S>,
    options: ValueForOptions = {},
  ): Promise<S> {
    const on = options.on ?? new Date().toISOString().slice(0, 10);
    const resolved = resolvePack(await this.packs(), market, options);
    const shape = schemaOf(section);
    const fields = shape instanceof z.ZodObject ? Object.keys(shape.shape) : [];
    const values: Record<string, unknown> = {};
    for (const field of fields) {
      const found = valueOf(resolved, `${section.packPrefix}.${snakeCase(field)}`, on);
      if (found !== undefined) values[field] = found.value;
    }
    return section.create(values as Fields<S>);
  }
}

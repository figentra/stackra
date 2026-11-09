/**
 * Stackra file contract:
 * Purpose: `BundledPacks`, what the interim `bundled` pack source reads: the deployment's pins, environment and
 *          production switch, the content-hash index of the bundled live packs, and a lazy loader per market.
 * Boundary: a type only; the driver builds it from `MarketPacksConfig`, `BUNDLED_PACK_HASHES` and
 *           `BUNDLED_PACK_LOADERS`, and a test or tool hands its own to `BundledResolvedPackSourceDriver.with`.
 * Runtime: isomorphic
 * Governing contract: ADR 0386 (as amended 2026-11-09); ADR 0418.
 */
import type { MarketPacksOptions } from "#core/schemas/market-packs-options.schema";

/** The inputs of the `bundled` source. */
export type BundledPacks = {
  /** The pinned hashes, the running environment and whether production may use this source. */
  readonly config: Pick<
    MarketPacksOptions,
    "packHashes" | "environment" | "allowBundledInProduction"
  >;

  /** Content hash to market code, for the live packs bundled. */
  readonly index: Readonly<Record<string, string>>;

  /** Market code to a loader of its bundled pack file (the pack is the module's `default`). */
  readonly loaders: Readonly<Record<string, () => Promise<{ readonly default: unknown }>>>;
};

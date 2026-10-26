/**
 * Stackra file contract:
 * Purpose: `MarketPacksOptions`, the shape of the market-packs configuration: which `ResolvedPackSource` driver runs,
 *          the content hashes of the packs this deployment serves, and the trusted public keys.
 * Boundary: a shape class, the `schema` of `MarketPacksConfig`; it registers this package's own schema
 *           (`MARKET_PACKS_CONFIG_SCHEMA`) for itself when the module loads, so `buildConfig(MarketPacksConfig)`
 *           validates with no generated file. Deploy-time values only: which packs a deployment trusts is decided at
 *           release, never per tenant (a tenant's pins are tenant data).
 * Runtime: isomorphic
 * Governing contract: ADR 0418; ADR 0294 (decisions 19 and 26); ADR 0146 as amended; ADR 0263.
 */
import "#core/types/resolved-pack-source-driver-names.type";

import type { DriverName } from "@stackra/container";
import { registerSchemas, Schema } from "@stackra/validation";

import { MARKET_PACKS_CONFIG_SCHEMA } from "#core/constants/market-packs-config-schema.constant";
import type { ResolvedPackSource } from "#core/ports/resolved-pack-source.port";

/**
 * Every option the package reads; a host changes values in its config override, never here.
 *
 * @example
 * export class MarketPacksConfig extends BaseMarketPacksConfig {
 *   override packHashes = ["9f2c…"];
 * }
 */
export class MarketPacksOptions extends Schema {
  /** Which source driver runs; names are the driver file prefixes (`store`, `memory`). */
  source: DriverName<ResolvedPackSource> = "store";

  /** The content hashes of the pack versions the deployment serves, fetched from `PackStore`. */
  packHashes: string[] = [];

  /** Key id to the base64 raw Ed25519 public key a pack signature is accepted from. */
  trustedKeys: Record<string, string> = {};
}

registerSchemas([[MarketPacksOptions, MARKET_PACKS_CONFIG_SCHEMA]]);

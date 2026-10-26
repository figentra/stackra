/**
 * Stackra file contract:
 * Purpose: `MarketPacksConfig`, the market-packs configuration (key `market_packs`): the first layer of package → host
 *          → environment → runway.
 * Boundary: a configuration class over `MarketPacksOptions`; `env` maps the source driver to its variable. Values
 *           only; never per scope (that is settings) and never a secret: the trusted keys are public. A custom source
 *           (the OS loader) is a host `@Replaces(ResolvedPackSource)` or a driver of its own.
 * Runtime: isomorphic
 * Governing contract: ADR 0418; ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0263.
 */
import { Config } from "@stackra/config";

import { MarketPacksOptions } from "#core/schemas/market-packs-options.schema";

/**
 * Injected by type and validated once at boot. A host overrides values in its own `src/config/market-packs.config.ts`,
 * under the same name with the package class aliased.
 *
 * @example
 * import { MarketPacksConfig as BaseMarketPacksConfig } from "@stackra/market-packs";
 *
 * export class MarketPacksConfig extends BaseMarketPacksConfig {
 *   override packHashes = ["9f2c…", "41ab…"];
 *   override trustedKeys = { "os-2026": "MCowBQYDK2VwAyEA…" };
 * }
 */
export class MarketPacksConfig extends Config({
  schema: MarketPacksOptions,
  env: { source: "STACKRA_MARKET_PACKS_SOURCE" },
}) {}

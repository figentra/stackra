/**
 * Stackra file contract:
 * Purpose: `PwaConfig`, the PWA configuration (key `platform.pwa`): what the installed web app and its service worker
 *          do while they run: manifest handlers, caching, offline, Web Push, updates and the install prompt.
 * Boundary: a configuration class over `PwaOptions` with no env map. A host overrides it as
 *           `class PwaConfig extends BasePwaConfig` with `override` members only, inheriting the key; each nested
 *           object spreads the base first and restates its type (`BasePwaConfig["caching"]`).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0255.
 */
import { Config } from "@stackra/config";

import { PwaOptions } from "#core/schemas/pwa-options.schema";

/**
 * The PWA configuration.
 *
 * @example
 * import { CachePreset, PwaConfig as BasePwaConfig } from "@stackra/platform";
 *
 * export class PwaConfig extends BasePwaConfig {
 *   override caching: BasePwaConfig["caching"] = { ...this.caching, preset: CachePreset.Balanced };
 * }
 */
export class PwaConfig extends Config({ schema: PwaOptions }) {}

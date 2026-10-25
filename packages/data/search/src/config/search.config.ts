/**
 * Stackra file contract:
 * Purpose: `SearchConfig`, the search configuration (key `search`): the `driver` choice runway sets per environment
 *          (`memory` in the template's dev lane, `postgres` everywhere else).
 * Boundary: a configuration class over `SearchOptions` with no env map; runway's `config.search` layer sets it. A host
 *           overrides it as `class SearchConfig extends BaseSearchConfig` with `override` members only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 19 and 20); ADR 0146 as amended; ADR 0296 (decision 1).
 */
import { Config } from "@stackra/config";

import { SearchOptions } from "#core/schemas/search-options.schema";

/**
 * The search configuration.
 *
 * @example
 * import { SearchConfig as BaseSearchConfig } from "@stackra/search";
 *
 * export class SearchConfig extends BaseSearchConfig {
 *   override driver: DriverName<SearchDriver> = "memory";
 * }
 */
export class SearchConfig extends Config({ schema: SearchOptions }) {}

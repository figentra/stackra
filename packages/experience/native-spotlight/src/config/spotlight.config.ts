/**
 * Stackra file contract:
 * Purpose: `SpotlightConfig`, the phone's search configuration (key `native-spotlight.spotlight`): the visibility
 *          rules `SpotlightIndexer` applies before anything reaches iOS Spotlight or Android launcher search.
 * Boundary: a configuration class over `SpotlightOptions` with no env map. A host overrides it as
 *           `class SpotlightConfig extends BaseSpotlightConfig` with `override` members only, inheriting the key.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended.
 */
import { Config } from "@stackra/config";

import { SpotlightOptions } from "#core/schemas/spotlight-options.schema";

/**
 * The phone's search configuration.
 *
 * @example
 * import { SpotlightConfig as BaseSpotlightConfig } from "@stackra/native-spotlight";
 *
 * export class SpotlightConfig extends BaseSpotlightConfig {
 *   override kinds = ["crm.customer", "sales.order"];
 * }
 */
export class SpotlightConfig extends Config({ schema: SpotlightOptions }) {}

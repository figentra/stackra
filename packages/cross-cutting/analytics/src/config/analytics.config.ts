/**
 * Stackra file contract:
 * Purpose: `AnalyticsConfig`, the configuration of @stackra/analytics (key `analytics`): the driver gen's wiring selects
 *          by `config:analytics.driver`, the consent category that gates delivery, the queue bound, the capture
 *          switches and the deny list, read by `AnalyticsClient` and the vendor drivers.
 * Boundary: a configuration class over `AnalyticsOptions` with no env map; runway's `config.analytics` layer sets it
 *           per environment. A host overrides it under the same name, with this class aliased `BaseAnalyticsConfig`,
 *           by `override` members only; its presence mounts the analytics context, so an app writes no provider.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0295 (decision 10); ADR 0146 as amended; ADR 0298.
 */
import { Config } from "@stackra/config";

import { AnalyticsOptions } from "#core/schemas/analytics-options.schema";

/**
 * Product analytics settings.
 *
 * @example
 * import { AnalyticsConfig as BaseAnalyticsConfig } from "@stackra/analytics";
 * import type { AnalyticsDriver } from "@stackra/analytics/contracts";
 *
 * export class AnalyticsConfig extends BaseAnalyticsConfig {
 *   override driver: DriverName<AnalyticsDriver> = "none";
 *   override consentCategory: ConsentCategory = ConsentCategory.Analytics;
 *   override denyProperties = ["email", "phone"];
 * }
 */
export class AnalyticsConfig extends Config({ schema: AnalyticsOptions }) {}

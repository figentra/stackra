/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/analytics (the configuration with its shipped schema, the
 *          delivery state, the `AnalyticsClient` and the `none` driver) until `stackra gen` writes the entry barrels
 *          (STA-339).
 * Boundary: names each re-export and declares nothing. The port and the delivery type are the `./contracts` entry's;
 *           the memory driver is the `./testing` entry's (one symbol, one entry). The shipped schema is re-exported
 *           under its generated name (`AnalyticsConfig$`). `AnalyticsDriverName` carries the `DriverRegistry`
 *           augmentation, so exporting it loads it for every consumer.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { AnalyticsConfig } from "#config/analytics.config";
export { ANALYTICS_CONFIG_SCHEMA as AnalyticsConfig$ } from "#core/constants/analytics-config-schema.constant";
export { NoneAnalyticsDriver } from "#core/drivers/none-analytics.driver";
export { AnalyticsState } from "#core/enums/analytics-state.enum";
export { AnalyticsOptions } from "#core/schemas/analytics-options.schema";
export { AnalyticsClient } from "#core/services/analytics-client.service";
export type { AnalyticsDriverName } from "#core/types/analytics-driver-name.type";

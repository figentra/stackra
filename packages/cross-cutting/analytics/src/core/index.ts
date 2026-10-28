/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/analytics (the configuration with its shipped schema, the
 *          delivery state, the `AnalyticsClient`, the `AnalyticsDestination` type and the `none`, `memory`, `posthog` and
 *          `ad-pixel` drivers, the `none` ad pixel, `adClickIdOf` with `AD_CLICK_ID_PARAMS`, the `AnalyticsConversion` type, with the `none` driver lookup, and the built-in auto-capture events `PageViewed`,
 *          `ScreenViewed` and `ElementClicked`) until `stackra gen` writes the entry barrels
 *          (STA-339).
 * Boundary: names each re-export and declares nothing. The port and the delivery type are the `./contracts` entry's;
 *           the native PostHog driver is the `./native` entry's (one symbol, one entry). The shipped schema is re-exported
 *           under its generated name (`AnalyticsConfig$`). `AnalyticsDriverName` carries the `DriverRegistry`
 *           augmentation, so exporting it loads it for every consumer.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { AnalyticsConfig } from "#config/analytics.config";
export { ElementClicked } from "#core/analytics/element-clicked.analytics-event";
export { PageViewed } from "#core/analytics/page-viewed.analytics-event";
export { ScreenViewed } from "#core/analytics/screen-viewed.analytics-event";
export { ANALYTICS_CONFIG_SCHEMA as AnalyticsConfig$ } from "#core/constants/analytics-config-schema.constant";
export { AD_CLICK_ID_PARAMS } from "#core/constants/ad-click-id-params.constant";
export { AdPixelAnalyticsDriver } from "#core/drivers/ad-pixel-analytics.driver";
export { CookieAnalyticsIdentityDriver } from "#core/drivers/cookie-analytics-identity.driver";
export { MemoryAnalyticsDriver } from "#core/drivers/memory-analytics.driver";
export { MemoryAnalyticsIdentityDriver } from "#core/drivers/memory-analytics-identity.driver";
export { MemoryAnalyticsOfflineQueueDriver } from "#core/drivers/memory-analytics-offline-queue.driver";
export { NoneAdPixelDriver } from "#core/drivers/none-ad-pixel.driver";
export { NoneAnalyticsDriver } from "#core/drivers/none-analytics.driver";
export { NoneAnalyticsDriverLookupDriver } from "#core/drivers/none-analytics-driver-lookup.driver";
export { NoneAnalyticsOfflineQueueDriver } from "#core/drivers/none-analytics-offline-queue.driver";
export { PosthogAnalyticsDriver } from "#core/drivers/posthog-analytics.driver";
export { StorageAnalyticsIdentityDriver } from "#core/drivers/storage-analytics-identity.driver";
export { StorageAnalyticsOfflineQueueDriver } from "#core/drivers/storage-analytics-offline-queue.driver";
export { AnalyticsState } from "#core/enums/analytics-state.enum";
export { adClickIdOf } from "#core/functions/ad-click-id-of.function";
export { AnalyticsOptions } from "#core/schemas/analytics-options.schema";
export { AnalyticsClient } from "#core/services/analytics-client.service";
export type { AnalyticsConversion } from "#core/types/analytics-conversion.type";
export type { AnalyticsDestination } from "#core/types/analytics-destination.type";
export type { AnalyticsDriverName } from "#core/types/analytics-driver-name.type";

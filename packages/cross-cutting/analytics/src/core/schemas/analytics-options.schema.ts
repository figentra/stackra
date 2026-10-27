/**
 * Stackra file contract:
 * Purpose: `AnalyticsOptions`, the shape of `AnalyticsConfig`: which driver sends, which consent category gates it,
 *          how many events may wait for a decision, what a vendor driver captures on its own, where it sends, which
 *          property names never leave the device, and the PostHog project key and host the `posthog` driver sends to.
 * Boundary: a shape class; it registers this package's own schema (`ANALYTICS_CONFIG_SCHEMA`) for itself when the
 *           module loads, so `buildConfig(AnalyticsConfig)` validates with no generated file. The defaults send
 *           nothing anywhere: the `none` driver, gated by `analytics`, nothing captured automatically, no cookies.
 *           The capture switches, the ingest origin and the PostHog key and host are read by vendor drivers only. The
 *           PostHog key is public; the host feeds it from its env configuration (`analyticsPosthogKey`), so this
 *           shape has no env map.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decisions 1 and 5); ADR 0294 (decisions 4, 19 and 26).
 */
import { ConsentCategory } from "@stackra/consent";
import type { DriverName } from "@stackra/container";
import { Int, registerSchemas, Schema } from "@stackra/validation";

import type { AnalyticsDriver } from "#contracts/ports/analytics-driver.port";
import { ANALYTICS_CONFIG_SCHEMA } from "#core/constants/analytics-config-schema.constant";

/**
 * The analytics settings.
 *
 * @example
 * export class AnalyticsConfig extends BaseAnalyticsConfig {
 *   override consentCategory: ConsentCategory = ConsentCategory.Analytics;
 *   override denyProperties = ["email", "phone"];
 * }
 */
export class AnalyticsOptions extends Schema {
  /** Events that may wait for a decision (0 to 1,000); later ones are dropped so the earliest, the first view, stay. */
  @Int({
    min: 0,
    max: 1000,
  })
  queueLimit = 100;

  /** The registered `AnalyticsDriver` that sends; `none` sends nothing, `memory` keeps events, `posthog` sends there. */
  driver: DriverName<AnalyticsDriver> = "none";

  /** The consent category that must be granted before any event leaves the device; never `necessary`. */
  consentCategory: ConsentCategory = ConsentCategory.Analytics;

  /** A vendor driver records a page (or screen) view per navigation. */
  autocapturePageviews = false;

  /** A vendor driver records clicks (or taps) without an explicit event. */
  autocaptureClicks = false;

  /** A vendor driver sends field web vitals with the page view. */
  webVitals = false;

  /** A vendor driver records session replays. */
  sessionReplay = false;

  /** A vendor driver runs without cookies until consent is granted. */
  cookieless = true;

  /** The origin a vendor driver sends to, such as a reverse proxy on the site's own origin; empty means its host. */
  ingestOrigin = "";

  /** Property names removed from every event before it leaves the device. */
  denyProperties: string[] = [];

  /** The PostHog project API key (public, `phc_...`); `null` when PostHog is not used. */
  posthogKey: string | null = null;

  /** The PostHog host the `posthog` driver sends to when `ingestOrigin` is empty. */
  posthogHost = "https://eu.i.posthog.com";
}

registerSchemas([[AnalyticsOptions, ANALYTICS_CONFIG_SCHEMA]]);

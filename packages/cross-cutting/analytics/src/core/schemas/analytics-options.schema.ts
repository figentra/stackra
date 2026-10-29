/**
 * Stackra file contract:
 * Purpose: `AnalyticsOptions`, the shape of `AnalyticsConfig`: which driver sends, which consent category gates it,
 *          how many events may wait for a decision, what is captured automatically, where it sends, which
 *          property names never leave the device, the PostHog project key and host the `posthog` driver sends to, and
 *          where and how long the visitor's identity is kept after consent, and
 *          how the delivery engine batches, retries, samples and keeps events offline, and the destinations: named
 *          driver instances and the list of destinations, each gated by its own consent category (stackra-407), and
 *          the conversions the `ad-pixel` driver fires with its `AdPixel` driver (stackra-412).
 * Boundary: a shape class; it registers this package's own schema (`ANALYTICS_CONFIG_SCHEMA`) for itself when the
 *           module loads, so `buildConfig(AnalyticsConfig)` validates with no generated file. The defaults send
 *           nothing anywhere: the `none` driver, gated by `analytics`, nothing captured automatically, no cookies.
 *           The capture switches are read by the auto-capture hooks; the ingest origin and the PostHog key and host by
 *           vendor drivers only; web vitals and replay are `TelemetryConfig`'s (@stackra/logger), never here. The
 *           PostHog key is public; the host feeds it from its env configuration (`analyticsPosthogKey`), so this
 *           shape has no env map. The PostHog personal API key, which only a server erasure uses (STA-1582), is the
 *           `ANALYTICS_POSTHOG_PERSONAL_API_KEY` secret, never a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decisions 1 and 5); ADR 0294 (decisions 4, 19 and 26).
 */
import { Secret } from "@stackra/config";
import { ConsentCategory } from "@stackra/consent";
import type { DriverName } from "@stackra/container";
import { Field, Int, Num, registerSchemas, Schema } from "@stackra/validation";

import type { AdPixel } from "#contracts/ports/ad-pixel.port";
import type { AnalyticsDriver } from "#contracts/ports/analytics-driver.port";
import type { AnalyticsIdentity } from "#contracts/ports/analytics-identity.port";
import type { AnalyticsOfflineQueue } from "#contracts/ports/analytics-offline-queue.port";
import { ANALYTICS_CONFIG_SCHEMA } from "#core/constants/analytics-config-schema.constant";
import type { AnalyticsConversion } from "#core/types/analytics-conversion.type";
import type { AnalyticsDestination } from "#core/types/analytics-destination.type";

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
  /**
   * The PostHog personal API key (`phx_...`, scope `person:write`) a server erasure deletes a person with; empty when
   * PostHog is not used. A secret, resolved from the secret store, never a value.
   */
  @Secret("ANALYTICS_POSTHOG_PERSONAL_API_KEY")
  posthogPersonalApiKey = "";

  /** Events that may wait for a decision (0 to 1,000); later ones are dropped so the earliest, the first view, stay. */
  @Int({
    min: 0,
    max: 1000,
  })
  queueLimit = 100;

  /** How long the visitor's identity is kept by the `cookie` or `storage` identity driver, in days (1 to 400). */
  @Int({
    min: 1,
    max: 400,
  })
  identityExpiryDays = 365;

  /** Events that make a batch: the buffer is sent as soon as it holds this many (1 to 100). */
  @Int({
    min: 1,
    max: 100,
  })
  flushAt = 20;

  /** The longest an event waits in the buffer before it is sent, in ms (0 sends at once; at most a minute). */
  @Int({
    min: 0,
    max: 60_000,
  })
  flushIntervalMs = 5000;

  /** Retries of a failed batch before it is dropped or kept offline (0 to 10). */
  @Int({
    min: 0,
    max: 10,
  })
  retryAttempts = 3;

  /** The first retry's wait, in ms; each later wait doubles, with jitter, up to `retryMaxMs`. */
  @Int({
    min: 100,
    max: 60_000,
  })
  retryBaseMs = 1000;

  /** The longest wait between retries, in ms. */
  @Int({
    min: 1000,
    max: 600_000,
  })
  retryMaxMs = 30_000;

  /** Deliveries the buffer holds while sends fail; the newest beyond it are dropped. */
  @Int({
    min: 1,
    max: 10_000,
  })
  bufferLimit = 1000;

  /** Deliveries the offline queue keeps for the next launch (0 to 5,000). */
  @Int({
    min: 0,
    max: 5000,
  })
  offlineLimit = 500;

  /** The share of visitors whose events are sent, 0 to 1; the same visitor is always in or out. */
  @Num({
    min: 0,
    max: 1,
  })
  sampleRate = 1;

  /** Event name to its own sample rate, replacing `sampleRate` for that event (for example a noisy `page.scrolled`). */
  @Num({
    min: 0,
    max: 1,
    each: true,
  })
  sampleRates: Record<string, number> = {};

  /**
   * Where deliveries go, each destination gated by its own consent category and routed by event name; empty sends to
   * the `default` instance gated by `consentCategory`.
   */
  // reason: an array of objects a host override replaces whole; the shipped schema already states its rule
  @Field(ANALYTICS_CONFIG_SCHEMA.shape.destinations)
  destinations: AnalyticsDestination[] = [];

  /**
   * The analytics events the `ad-pixel` driver fires as conversions, each with its conversion name and the property
   * whose value is the dedup id the server conversion shares; empty fires nothing.
   */
  // reason: an array of objects a host override replaces whole; the shipped schema already states its rule
  @Field(ANALYTICS_CONFIG_SCHEMA.shape.conversions)
  conversions: AnalyticsConversion[] = [];

  /**
   * The registered `AnalyticsDriver` that sends (the `default` destination); `none` sends nothing, `memory` keeps
   * events, `posthog` sends there.
   */
  driver: DriverName<AnalyticsDriver> = "none";

  /**
   * The consent category that gates the `default` destination when `destinations` is empty, and that must be granted
   * before the visitor's identity is kept; never `necessary`.
   */
  consentCategory: ConsentCategory = ConsentCategory.Analytics;

  /** Named driver instances, instance name to driver name (`{ segment: "segment" }`), that destinations send to. */
  drivers: Record<string, DriverName<AnalyticsDriver>> = {};

  /** `useAutocapture` (web) and `useScreenViews` (native) track a `page.viewed` or `screen.viewed` per navigation. */
  autocapturePageviews = false;

  /** `useAutocapture` tracks an `element.clicked` for a click inside an element with a `data-track` name (web). */
  autocaptureClicks = false;

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

  /** The PostHog private API host a server erasure deletes a person through (`https://us.posthog.com`, a self-host). */
  posthogApiHost = "https://eu.posthog.com";

  /** The PostHog project id a server erasure deletes a person in; empty when PostHog is not used (owner value). */
  posthogProjectId = "";

  /**
   * The registered `AnalyticsIdentity` that keeps the visitor's identity after consent: `memory` (nothing outlives the
   * launch), `cookie` (the web) or `storage` (a device).
   */
  identityDriver: DriverName<AnalyticsIdentity> = "memory";

  /** The first-party cookie the `cookie` identity driver keeps the identity in. */
  identityCookieName = "stk_aid";

  /**
   * The registered `AnalyticsOfflineQueue` that keeps batches a send could not deliver for the next launch: `none`
   * (the default, nothing kept), `memory` or `storage` (a device's `prefs` area).
   */
  offlineDriver: DriverName<AnalyticsOfflineQueue> = "none";

  /**
   * The registered `AdPixel` the `ad-pixel` driver fires on: `none` (the default) fires nothing; vendor pixels are OS
   * integrations drivers.
   */
  adPixelDriver: DriverName<AdPixel> = "none";
}

registerSchemas([[AnalyticsOptions, ANALYTICS_CONFIG_SCHEMA]]);

/**
 * Stackra file contract:
 * Purpose: `ANALYTICS_CONFIG_SCHEMA`, the zod schema this package ships for `AnalyticsConfig` (exported as
 *          `AnalyticsConfig$`): the driver, the consent category that gates delivery, the bound of the pre-consent
 *          queue, the auto-capture switches (page or screen views and `data-track` clicks; web vitals
 *          and replay are `TelemetryConfig`'s only, stackra-409), the ingest origin, the deny list, the PostHog key
 *          and host, the identity driver, cookie name and
 *          lifetime (identity stitching), and the delivery engine: flush size and window, bounded retry, buffer bound,
 *          sampling (global and per event) and the offline queue; and the destinations (stackra-407): named driver
 *          instances (`drivers`) and the destination list, each with its own gating category and event routing.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default and there is no object-level
 *           refinement, so `.parse({})` gives the full defaults and a member's generated `AnalyticsConfig$` extends it
 *           (`AnalyticsConfig$.shape.driver.unwrap().default(...)`). The rules sit on the fields: the gating category
 *           is never `necessary` (that would send without asking), the queue holds 0 to 1,000 events, the ingest
 *           origin is empty or an http(s) URL, and the PostHog host is an http(s) URL. The driver names are the shipped drivers;
 *           the identity cookie name is a cookie token and the identity lives 1 to 400 days; sample rates are
 *           between 0 and 1; `default` is not a `drivers` key (it names the `driver` instance) and a destination's
 *           category is never `necessary`, each driver instance listed once. The defaults equal
 *           `AnalyticsOptions`' initializers (tested).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0298 (decisions 1 and 5).
 */
import { ConsentCategory } from "@stackra/consent";
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { ANALYTICS_DEFAULT_DESTINATION } from "#core/constants/analytics-default-destination.constant";

/** A consent category an optional send may be gated by: never `necessary`. */
const GATING_CATEGORY = z
  .enum(Enum.values(ConsentCategory))
  .refine((category) => category !== ConsentCategory.Necessary, {
    message: "Analytics is gated by an optional consent category, never `necessary`",
  });

/** The shipped analytics driver names. */
const DRIVER = z.enum(["none", "memory", "posthog"]);

/** One destination: a driver instance, its own gating category and its event routing. */
const DESTINATION = z.object({
  driver: z.string().min(1),
  category: GATING_CATEGORY,
  include: z.array(z.string().min(1)).default(() => []),
  exclude: z.array(z.string().min(1)).default(() => []),
});

/** An RFC 6265 cookie-name token: no separators, spaces or controls. */
const COOKIE_NAME = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

// shortcut: authored until gen compiles this package's AnalyticsOptions into #stackra/schemas; replace with STA-339.
/** The shipped `AnalyticsConfig$`. */
export const ANALYTICS_CONFIG_SCHEMA = z.object({
  driver: DRIVER.default("none"),
  consentCategory: GATING_CATEGORY.default(ConsentCategory.Analytics),
  drivers: z
    .record(
      z
        .string()
        .min(1)
        .refine((name) => name !== ANALYTICS_DEFAULT_DESTINATION, {
          message: "`default` names the `driver` instance; pick another instance name",
        }),
      DRIVER,
    )
    .default(() => ({})),
  destinations: z
    .array(DESTINATION)
    .refine((list) => new Set(list.map((entry) => entry.driver)).size === list.length, {
      message: "Each driver instance is one destination; list it once",
    })
    .default(() => []),
  queueLimit: z.number().int().min(0).max(1000).default(100),
  autocapturePageviews: z.boolean().default(false),
  autocaptureClicks: z.boolean().default(false),
  cookieless: z.boolean().default(true),
  ingestOrigin: z.union([z.literal(""), z.url({ protocol: /^https?$/ })]).default(""),
  denyProperties: z.array(z.string().min(1)).default(() => []),
  posthogKey: z.string().nullable().default(null),
  posthogHost: z.url({ protocol: /^https?$/ }).default("https://eu.i.posthog.com"),
  identityDriver: z.enum(["memory", "cookie", "storage"]).default("memory"),
  identityCookieName: z.string().regex(COOKIE_NAME).default("stk_aid"),
  identityExpiryDays: z.number().int().min(1).max(400).default(365),
  flushAt: z.number().int().min(1).max(100).default(20),
  flushIntervalMs: z.number().int().min(0).max(60_000).default(5000),
  retryAttempts: z.number().int().min(0).max(10).default(3),
  retryBaseMs: z.number().int().min(100).max(60_000).default(1000),
  retryMaxMs: z.number().int().min(1000).max(600_000).default(30_000),
  bufferLimit: z.number().int().min(1).max(10_000).default(1000),
  sampleRate: z.number().min(0).max(1).default(1),
  sampleRates: z.record(z.string().min(1), z.number().min(0).max(1)).default(() => ({})),
  offlineDriver: z.enum(["none", "memory", "storage"]).default("none"),
  offlineLimit: z.number().int().min(0).max(5000).default(500),
});

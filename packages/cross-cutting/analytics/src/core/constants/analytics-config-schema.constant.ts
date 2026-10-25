/**
 * Stackra file contract:
 * Purpose: `ANALYTICS_CONFIG_SCHEMA`, the zod schema this package ships for `AnalyticsConfig` (exported as
 *          `AnalyticsConfig$`): the driver, the consent category that gates delivery, the bound of the pre-consent
 *          queue, the capture switches a vendor driver reads, the ingest origin, the deny list and the PostHog key
 *          and host.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default and there is no object-level
 *           refinement, so `.parse({})` gives the full defaults and a member's generated `AnalyticsConfig$` extends it
 *           (`AnalyticsConfig$.shape.driver.unwrap().default(...)`). The rules sit on the fields: the gating category
 *           is never `necessary` (that would send without asking), the queue holds 0 to 1,000 events, the ingest
 *           origin is empty or an http(s) URL, and the PostHog host is an http(s) URL. The driver names are the shipped drivers. The defaults equal
 *           `AnalyticsOptions`' initializers (tested).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0298 (decisions 1 and 5).
 */
import { ConsentCategory } from "@stackra/consent";
import { Enum } from "@stackra/contracts";
import { z } from "zod";

// shortcut: authored until gen compiles this package's AnalyticsOptions into #stackra/schemas; replace with STA-339.
/** The shipped `AnalyticsConfig$`. */
export const ANALYTICS_CONFIG_SCHEMA = z.object({
  driver: z.enum(["none", "memory", "posthog"]).default("none"),
  consentCategory: z
    .enum(Enum.values(ConsentCategory))
    .refine((category) => category !== ConsentCategory.Necessary, {
      message: "Analytics is gated by an optional consent category, never `necessary`",
    })
    .default(ConsentCategory.Analytics),
  queueLimit: z.number().int().min(0).max(1000).default(100),
  autocapturePageviews: z.boolean().default(false),
  autocaptureClicks: z.boolean().default(false),
  webVitals: z.boolean().default(false),
  sessionReplay: z.boolean().default(false),
  cookieless: z.boolean().default(true),
  ingestOrigin: z.union([z.literal(""), z.url({ protocol: /^https?$/ })]).default(""),
  denyProperties: z.array(z.string().min(1)).default(() => []),
  posthogKey: z.string().nullable().default(null),
  posthogHost: z.url({ protocol: /^https?$/ }).default("https://eu.i.posthog.com"),
});

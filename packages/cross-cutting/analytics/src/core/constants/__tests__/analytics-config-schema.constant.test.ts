/**
 * Stackra file contract:
 * Purpose: unit tests of `ANALYTICS_CONFIG_SCHEMA`: the defaults that send nothing anywhere, the field rules (never
 *          gated by `necessary`, a queue of 0 to 1,000, an empty or http(s) ingest origin, known driver names,
 *          non-empty deny names, an http(s) PostHog host), and no object-level refinement, so a member's generated schema can `.extend` it in
 *          the template's mobile form.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 26); ADR 0298 (decisions 1 and 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { ANALYTICS_CONFIG_SCHEMA } from "#core/constants/analytics-config-schema.constant";

describe("ANALYTICS_CONFIG_SCHEMA", () => {
  it("parses nothing into defaults that send nothing anywhere", () => {
    expect(ANALYTICS_CONFIG_SCHEMA.parse({})).toEqual({
      driver: "none",
      consentCategory: "analytics",
      drivers: {},
      destinations: [],
      queueLimit: 100,
      autocapturePageviews: false,
      autocaptureClicks: false,
      cookieless: true,
      ingestOrigin: "",
      denyProperties: [],
      posthogKey: null,
      posthogHost: "https://eu.i.posthog.com",
      posthogApiHost: "https://eu.posthog.com",
      posthogProjectId: "",
      posthogPersonalApiKey: "",
      identityDriver: "memory",
      identityCookieName: "stk_aid",
      identityExpiryDays: 365,
      flushAt: 20,
      flushIntervalMs: 5000,
      retryAttempts: 3,
      retryBaseMs: 1000,
      retryMaxMs: 30_000,
      bufferLimit: 1000,
      sampleRate: 1,
      sampleRates: {},
      offlineDriver: "none",
      offlineLimit: 500,
      conversions: [],
      adPixelDriver: "none",
    });
  });

  it("accepts the posthog driver with its key and another host", () => {
    const parsed = ANALYTICS_CONFIG_SCHEMA.parse({
      driver: "posthog",
      posthogKey: "phc_test",
      posthogHost: "https://us.i.posthog.com",
    });
    expect(parsed.driver).toBe("posthog");
    expect(parsed.posthogKey).toBe("phc_test");
    expect(parsed.posthogHost).toBe("https://us.i.posthog.com");
  });

  it("accepts a reverse-proxied ingest origin and another optional category", () => {
    const parsed = ANALYTICS_CONFIG_SCHEMA.parse({
      ingestOrigin: "https://www.acme.example/ingest",
      consentCategory: "crash_replay",
    });
    expect(parsed.ingestOrigin).toBe("https://www.acme.example/ingest");
    expect(parsed.consentCategory).toBe("crash_replay");
  });

  it("fills a destination's routing lists", () => {
    const parsed = ANALYTICS_CONFIG_SCHEMA.parse({
      drivers: { segment: "posthog" },
      destinations: [{ driver: "segment", category: "marketing", include: ["order.placed"] }],
    });
    expect(parsed.destinations).toEqual([
      { driver: "segment", category: "marketing", include: ["order.placed"], exclude: [] },
    ]);
  });

  it.each([
    ["gating by the necessary category", { consentCategory: "necessary" }],
    ["an unknown category", { consentCategory: "telemetry" }],
    ["an unknown driver", { driver: "segment" }],
    ["an instance named default", { drivers: { default: "posthog" } }],
    ["an unknown driver for an instance", { drivers: { segment: "segment" } }],
    [
      "a destination gated by the necessary category",
      { destinations: [{ driver: "default", category: "necessary" }] },
    ],
    [
      "one driver instance listed twice",
      {
        destinations: [
          { driver: "default", category: "analytics" },
          { driver: "default", category: "marketing" },
        ],
      },
    ],
    ["a negative queue bound", { queueLimit: -1 }],
    ["a queue bound past 1,000", { queueLimit: 1001 }],
    ["a fractional queue bound", { queueLimit: 2.5 }],
    ["an ingest origin that is not a URL", { ingestOrigin: "ingest" }],
    ["a script URL as the ingest origin", { ingestOrigin: "javascript:alert(1)" }],
    ["an empty deny name", { denyProperties: [""] }],
    ["a PostHog host that is not a URL", { posthogHost: "posthog" }],
    ["a PostHog API host that is not a URL", { posthogApiHost: "posthog" }],
    ["an unknown identity driver", { identityDriver: "localStorage" }],
    ["an identity cookie name with a space", { identityCookieName: "my id" }],
    ["an identity kept past 400 days", { identityExpiryDays: 401 }],
    ["an empty batch", { flushAt: 0 }],
    ["a flush window past a minute", { flushIntervalMs: 60_001 }],
    ["more than 10 retries", { retryAttempts: 11 }],
    ["a sample rate above 1", { sampleRate: 1.5 }],
    ["a negative per-event sample rate", { sampleRates: { "page.scrolled": -0.1 } }],
    ["an unknown offline driver", { offlineDriver: "indexeddb" }],
    ["a conversion with no name", { conversions: [{ event: "checkout.completed", name: "" }] }],
    [
      "one event listed as two conversions",
      {
        conversions: [
          { event: "checkout.completed", name: "purchase" },
          { event: "checkout.completed", name: "lead" },
        ],
      },
    ],
    ["an unknown ad pixel driver", { adPixelDriver: "meta" }],
  ])("refuses %s", (_case, values) => {
    expect(ANALYTICS_CONFIG_SCHEMA.safeParse(values).success).toBe(false);
  });

  it("accepts the ad-pixel driver as an instance with its conversions", () => {
    const parsed = ANALYTICS_CONFIG_SCHEMA.parse({
      drivers: { pixel: "ad-pixel" },
      destinations: [{ driver: "pixel", category: "marketing" }],
      conversions: [{ event: "checkout.completed", name: "purchase", ref: "orderId" }],
    });
    expect(parsed.conversions).toEqual([
      { event: "checkout.completed", name: "purchase", ref: "orderId" },
    ]);
  });

  it("can be extended field by field, as gen extends it for the mobile app", () => {
    const { shape } = ANALYTICS_CONFIG_SCHEMA;
    const Mobile$ = ANALYTICS_CONFIG_SCHEMA.extend({
      consentCategory: shape.consentCategory.unwrap().default("analytics"),
      autocapturePageviews: shape.autocapturePageviews.unwrap().default(true),
      autocaptureClicks: shape.autocaptureClicks.unwrap().default(false),
      denyProperties: shape.denyProperties.unwrap().default(() => ["email", "phone"]),
    });
    const parsed = Mobile$.parse({});
    expect(parsed.autocapturePageviews).toBe(true);
    expect(parsed.denyProperties).toEqual(["email", "phone"]);
    expect(Mobile$.safeParse({ consentCategory: "necessary" }).success).toBe(false);
  });
});

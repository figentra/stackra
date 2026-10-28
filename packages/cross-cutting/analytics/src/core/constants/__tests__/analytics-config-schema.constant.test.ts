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
      queueLimit: 100,
      autocapturePageviews: false,
      autocaptureClicks: false,
      webVitals: false,
      sessionReplay: false,
      cookieless: true,
      ingestOrigin: "",
      denyProperties: [],
      posthogKey: null,
      posthogHost: "https://eu.i.posthog.com",
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

  it.each([
    ["gating by the necessary category", { consentCategory: "necessary" }],
    ["an unknown category", { consentCategory: "telemetry" }],
    ["an unknown driver", { driver: "segment" }],
    ["a negative queue bound", { queueLimit: -1 }],
    ["a queue bound past 1,000", { queueLimit: 1001 }],
    ["a fractional queue bound", { queueLimit: 2.5 }],
    ["an ingest origin that is not a URL", { ingestOrigin: "ingest" }],
    ["a script URL as the ingest origin", { ingestOrigin: "javascript:alert(1)" }],
    ["an empty deny name", { denyProperties: [""] }],
    ["a PostHog host that is not a URL", { posthogHost: "posthog" }],
  ])("refuses %s", (_case, values) => {
    expect(ANALYTICS_CONFIG_SCHEMA.safeParse(values).success).toBe(false);
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

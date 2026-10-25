/**
 * Stackra file contract:
 * Purpose: unit tests of `CONSENT_CONFIG_SCHEMA`: the declining defaults, the field rules (a required category is
 *          granted by default, a category appears once, a cookie-name token, 1 to 400 days, a known regime), and no
 *          object-level refinement, so a member's generated schema can `.extend` it.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 26); ADR 0298.
 */
import { describe, expect, it } from "@stackra/testing";

import { CONSENT_CONFIG_SCHEMA } from "#core/constants/consent-config-schema.constant";

/** An optional analytics entry. */
const ANALYTICS = {
  category: "analytics",
  required: false,
  defaultGranted: false,
  descriptionKey: null,
};

describe("CONSENT_CONFIG_SCHEMA", () => {
  it("parses nothing into the declining defaults", () => {
    expect(CONSENT_CONFIG_SCHEMA.parse({})).toEqual({
      categories: [
        { category: "necessary", required: true, defaultGranted: true, descriptionKey: null },
      ],
      cookieName: "consent",
      expiryDays: 180,
      policyVersion: "1",
      regionDefaults: {},
      askOnFirstLaunch: false,
    });
  });

  it("defaults a missing description key to null", () => {
    const { descriptionKey: _omitted, ...entry } = ANALYTICS;
    expect(
      CONSENT_CONFIG_SCHEMA.parse({ categories: [entry] }).categories[0]?.descriptionKey,
    ).toBeNull();
  });

  it("accepts a regime per region and the default entry", () => {
    expect(
      CONSENT_CONFIG_SCHEMA.parse({ regionDefaults: { default: "gdpr", US: "ccpa" } })
        .regionDefaults,
    ).toEqual({ default: "gdpr", US: "ccpa" });
  });

  it.each([
    ["a required category refused by default", { categories: [{ ...ANALYTICS, required: true }] }],
    ["a category listed twice", { categories: [ANALYTICS, ANALYTICS] }],
    ["an empty description key", { categories: [{ ...ANALYTICS, descriptionKey: "" }] }],
    ["a cookie name with a space", { cookieName: "my consent" }],
    ["a fractional expiry", { expiryDays: 1.5 }],
    ["an expiry past 400 days", { expiryDays: 401 }],
    ["an empty region code", { regionDefaults: { "": "gdpr" } }],
  ])("refuses %s", (_case, values) => {
    expect(CONSENT_CONFIG_SCHEMA.safeParse(values).success).toBe(false);
  });

  it("can be extended field by field, as gen extends it", () => {
    const extended = CONSENT_CONFIG_SCHEMA.extend({
      cookieName: CONSENT_CONFIG_SCHEMA.shape.cookieName.unwrap().default("site_consent"),
    });
    expect(extended.parse({}).cookieName).toBe("site_consent");
  });
});

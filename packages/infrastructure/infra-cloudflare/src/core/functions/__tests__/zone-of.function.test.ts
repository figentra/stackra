/**
 * Stackra file contract:
 * Purpose: unit tests of `zoneOf`: the longest matching zone wins, the apex matches itself, and a foreign or
 *          look-alike host matches nothing.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0437 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { zoneOf } from "#core/functions/zone-of.function";

const zones = ["figentra.com", "eu.figentra.com", "figentra.cloud"];

describe("zoneOf", () => {
  it("picks the longest zone holding the host", () => {
    expect(zoneOf("api.eu.figentra.com", zones)).toBe("eu.figentra.com");
    expect(zoneOf("api.figentra.com", zones)).toBe("figentra.com");
    expect(zoneOf("figentra.cloud", zones)).toBe("figentra.cloud");
  });

  it("matches no foreign or look-alike host", () => {
    expect(zoneOf("api.acme.example", zones)).toBeUndefined();
    expect(zoneOf("notfigentra.com", zones)).toBeUndefined();
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `compareReleases`: numeric order per part, a prerelease below its release, equality, and a
 *          malformed release refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0395 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { compareReleases } from "#core/functions/compare-releases.function";

describe(compareReleases, () => {
  it("orders releases by number, a prerelease below its release", () => {
    expect(compareReleases("1.4.0", "1.10.0")).toBeLessThan(0);
    expect(compareReleases("2.0.0", "1.99.99")).toBeGreaterThan(0);
    expect(compareReleases("2.0.0-rc.1", "2.0.0")).toBeLessThan(0);
    expect(compareReleases("2.0.0", "2.0.0-rc.1")).toBeGreaterThan(0);
    expect(compareReleases("3.1.4", "3.1.4")).toBe(0);
  });

  it("refuses what is not a release", () => {
    expect(() => compareReleases("v1", "1.0.0")).toThrow(TypeError);
    expect(() => compareReleases("1.0.0", "2026-10-26")).toThrow(TypeError);
  });
});

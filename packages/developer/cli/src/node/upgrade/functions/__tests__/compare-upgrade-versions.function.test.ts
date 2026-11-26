/**
 * Stackra file contract:
 * Purpose: unit tests of `compareUpgradeVersions`: numeric (not text) order of each part, a prerelease below its
 *          release, prerelease identifiers numeric before text, and a refusal of anything but an exact version.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0199 (decision 2); STA-145.
 */
import { describe, expect, it } from "@stackra/testing";

import { compareUpgradeVersions } from "#node/upgrade/functions/compare-upgrade-versions.function";

describe("compareUpgradeVersions", () => {
  it("orders each part as a number, not as text", () => {
    expect(compareUpgradeVersions("0.30.0", "0.4.0")).toBeGreaterThan(0);
    expect(compareUpgradeVersions("0.9.10", "0.9.9")).toBeGreaterThan(0);
    expect(compareUpgradeVersions("1.0.0", "0.99.99")).toBeGreaterThan(0);
    expect(compareUpgradeVersions("0.33.1", "0.33.1")).toBe(0);
  });

  it("puts a prerelease below its release and orders prerelease identifiers", () => {
    expect(compareUpgradeVersions("1.0.0-rc.1", "1.0.0")).toBeLessThan(0);
    expect(compareUpgradeVersions("1.0.0-rc.2", "1.0.0-rc.10")).toBeLessThan(0);
    expect(compareUpgradeVersions("1.0.0-1", "1.0.0-alpha")).toBeLessThan(0);
    expect(compareUpgradeVersions("1.0.0-alpha", "1.0.0-alpha.1")).toBeLessThan(0);
    expect(compareUpgradeVersions("1.0.0-beta", "1.0.0-alpha")).toBeGreaterThan(0);
  });

  it("refuses a range or a partial version", () => {
    expect(() => compareUpgradeVersions("^0.30.0", "0.31.0")).toThrow(/not an exact version/);
    expect(() => compareUpgradeVersions("0.30", "0.31.0")).toThrow(/not an exact version/);
  });
});

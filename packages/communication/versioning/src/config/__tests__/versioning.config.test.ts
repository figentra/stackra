/**
 * Stackra file contract:
 * Purpose: unit tests of `VersioningConfig`: a configuration keyed `versioning`, empty (dormant) by default, built from
 *          a runway values layer, and refusing dates that are malformed, unsorted or repeated.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 19 and 20); ADR 0118.
 */
import { buildConfig, Config, configKey } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { VersioningConfig } from "#config/versioning.config";

describe("VersioningConfig", () => {
  it("is a configuration keyed versioning, dormant by default", () => {
    expect(new VersioningConfig()).toBeInstanceOf(Config);
    expect(configKey(VersioningConfig, "versioning")).toBe("versioning");
    expect(buildConfig(VersioningConfig).supported).toEqual([]);
  });

  it("takes the dates from a values layer and refuses a bad list", () => {
    expect(
      buildConfig(VersioningConfig, { values: { supported: ["2026-10-01", "2027-03-01"] } })
        .supported,
    ).toEqual(["2026-10-01", "2027-03-01"]);
    for (const supported of [["2027-03-01", "2026-10-01"], ["2026-10-01", "2026-10-01"], ["x"]])
      expect(() => buildConfig(VersioningConfig, { values: { supported } })).toThrow();
  });
});

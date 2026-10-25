/**
 * Stackra file contract:
 * Purpose: unit tests of `compareVersions`: numeric order by major, minor and patch.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing. Pack
 *           data is a made-up fixture, not any market's values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0370.
 */
import { describe, expect, it } from "@stackra/testing";

import { compareVersions } from "#core/functions/compare-versions.function";

describe("compareVersions", () => {
  it("orders numerically, part by part", () => {
    expect(compareVersions("2.10.0", "2.9.3")).toBeGreaterThan(0);
    expect(compareVersions("1.9.9", "2.0.0")).toBeLessThan(0);
    expect(compareVersions("2.0.1", "2.0.0")).toBeGreaterThan(0);
    expect(compareVersions("3.1.4", "3.1.4")).toBe(0);
  });
});

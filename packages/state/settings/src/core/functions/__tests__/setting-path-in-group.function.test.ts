/**
 * Stackra file contract:
 * Purpose: unit tests of `settingPathInGroup`: a name alone, or section and name.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0307 (rule 22); ADR 0213 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { settingPathInGroup } from "#core/functions/setting-path-in-group.function";

describe("settingPathInGroup", () => {
  it("derives a key's path in its group", () => {
    expect(settingPathInGroup({ name: "a" })).toBe("a");
    expect(settingPathInGroup({ name: "a", section: "s" })).toBe("s.a");
  });
});

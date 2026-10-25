/**
 * Stackra file contract:
 * Purpose: unit tests of `settingHolderOf`: the root, a node's path, and a user.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0307 (rule 22); ADR 0213 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { settingHolderOf } from "#core/functions/setting-holder-of.function";

describe("settingHolderOf", () => {
  it("names a target's holder", () => {
    expect(settingHolderOf({})).toBe("");
    expect(settingHolderOf({ scope: { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "p.a" } })).toBe(
      "p.a",
    );
    expect(settingHolderOf({ user: "usr_01j9z3k4m5n6p7q8r9s0t1v2w0" })).toBe(
      "user:usr_01j9z3k4m5n6p7q8r9s0t1v2w0",
    );
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `liveProviderOf`: a code or a live (or status-less) object is served; planned, empty and
 *          malformed entries are not.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0422 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { liveProviderOf } from "#core/functions/live-provider-of.function";

describe(liveProviderOf, () => {
  it("answers the code of a served entry", () => {
    expect(liveProviderOf("alpha")).toBe("alpha");
    expect(liveProviderOf({ provider: "beta", status: "live" })).toBe("beta");
    expect(liveProviderOf({ provider: "gamma" })).toBe("gamma");
  });

  it("serves nothing else", () => {
    for (const entry of [
      "",
      { provider: "beta", status: "planned" },
      { status: "live" },
      42,
      null,
      ["alpha"],
    ])
      expect(liveProviderOf(entry)).toBeUndefined();
  });
});

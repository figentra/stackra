/**
 * Stackra file contract:
 * Purpose: unit tests of `ElectionMethod`: the three methods in preference order with snake_case codes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ElectionMethod } from "#core/enums/election-method.enum";

describe("ElectionMethod", () => {
  it("holds the three methods in preference order", () => {
    expect(Enum.values(ElectionMethod)).toEqual(["web_locks", "broadcast_channel", "memory"]);
  });

  it("names each case", () => {
    expect(ElectionMethod.WebLocks).toBe("web_locks");
    expect(ElectionMethod.BroadcastChannel).toBe("broadcast_channel");
    expect(ElectionMethod.Memory).toBe("memory");
  });
});

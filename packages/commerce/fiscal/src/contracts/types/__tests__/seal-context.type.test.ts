/**
 * Stackra file contract:
 * Purpose: type tests of `SealContext`: a driver context plus the chain position and the time.
 * Boundary: test only; type-level checks with one runtime assertion each.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import type { SealContext } from "#contracts/types/seal-context.type";

describe("SealContext", () => {
  it("takes the first position of a chain and refuses a missing time", () => {
    const context: SealContext = {
      unitId: "till_1",
      options: {},
      previous: null,
      sequence: 1,
      now: new Date(0),
    };
    // @ts-expect-error -- the service passes the time
    const timeless: SealContext = { unitId: "till_1", options: {}, previous: null, sequence: 1 };
    expect([context.sequence, timeless.previous]).toEqual([1, null]);
  });
});

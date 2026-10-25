/**
 * Stackra file contract:
 * Purpose: type tests of `DriverContext`: a unit and raw options.
 * Boundary: test only; type-level checks with one runtime assertion each.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import type { DriverContext } from "#contracts/types/driver-context.type";

describe("DriverContext", () => {
  it("takes a unit and unvalidated options, and refuses a missing unit", () => {
    const context: DriverContext = { unitId: "till_1", options: { anything: 1 } };
    // @ts-expect-error -- every call names its unit
    const unitless: DriverContext = { options: {} };
    expect([context.options.anything, unitless.options]).toEqual([1, {}]);
  });
});

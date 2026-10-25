/**
 * Stackra file contract:
 * Purpose: unit tests of `MeterKind`: the five meter kinds of ADR 0216 decision 2 as snake_case codes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0216 (decision 2).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { MeterKind } from "#core/enums/meter-kind.enum";

describe("MeterKind", () => {
  it("holds the meter kinds", () => {
    expect(Enum.values(MeterKind)).toEqual(["count", "sum", "max", "last", "unique"]);
  });
});

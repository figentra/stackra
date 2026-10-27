/**
 * Stackra file contract:
 * Purpose: unit tests of `MeterKind`: the five meter kinds of ADR 0216 decision 2 as snake_case codes, the one set
 *          actions and model share.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0216 (decision 2); STA-1383.
 */
import { describe, expect, it } from "@stackra/testing";

import { Enum } from "#core/bases/enum.base";
import { MeterKind } from "#core/enums/meter-kind.enum";

describe("MeterKind", () => {
  it("holds the meter kinds", () => {
    expect(Enum.values(MeterKind)).toEqual(["count", "sum", "max", "last", "unique"]);
  });
});

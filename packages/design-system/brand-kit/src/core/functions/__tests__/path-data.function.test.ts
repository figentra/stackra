/**
 * Stackra file contract:
 * Purpose: unit tests of `pathData`: each command letter, the offset, two-decimal rounding and no `-0`.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0340 decision 10.
 */
import { describe, expect, it } from "@stackra/testing";

import { pathData } from "#core/functions/path-data.function";

describe("pathData", () => {
  it("writes every command, moved and rounded", () => {
    expect(
      pathData(
        [
          { type: "M", x: 0, y: -0.001 },
          { type: "L", x: 1.006, y: 2 },
          { type: "Q", x1: 1, y1: 1, x: 2, y: 2 },
          { type: "C", x1: 1, y1: 1, x2: 2, y2: 2, x: 3, y: 3 },
          { type: "Z" },
        ],
        10,
      ),
    ).toBe("M10 0L11.01 2Q11 1 12 2C11 1 12 2 13 3Z");
  });
});

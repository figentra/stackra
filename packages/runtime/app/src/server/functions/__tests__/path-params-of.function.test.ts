/**
 * Stackra file contract:
 * Purpose: unit tests of `pathParamsOf`: parameters are read by segment position and percent-decoded.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0237 (STA-2577 note).
 */
import { describe, expect, it } from "@stackra/testing";

import { pathParamsOf } from "#server/functions/path-params-of.function";

describe(pathParamsOf, () => {
  it("reads and decodes the parameters by position", () => {
    expect(pathParamsOf("/orders/:orderId/lines/:lineId", "/orders/ord%201/lines/l2")).toEqual({
      orderId: "ord 1",
      lineId: "l2",
    });
  });
});

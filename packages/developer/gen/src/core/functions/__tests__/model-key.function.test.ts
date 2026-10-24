/**
 * Stackra file contract:
 * Purpose: unit tests of `modelKey`: `<module>.<snake(Class)>`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 20).
 */
import { describe, expect, it } from "@stackra/testing";

import { modelKey } from "#core/functions/model-key.function";

describe("modelKey", () => {
  it("joins the module and the snake-cased class", () => {
    expect(modelKey("orders", "OrderLine")).toBe("orders.order_line");
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `registerChangeConsumers`: a pair watches a model by class name with its consumers in order; a
 *          pair registered twice is kept once; a second model class of the same name is refused.
 * Boundary: test only; the registry is cleared before each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0221 (decision 5).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";

import type { RowChange } from "#contracts/index";
import { CHANGE_CONSUMERS } from "#core/constants/change-consumers.constant";
import { registerChangeConsumers } from "#core/functions/register-change-consumers.function";

class Product {}

class IndexConsumer {
  async consume(_change: RowChange): Promise<void> {}
}

class SegmentConsumer {
  async consume(_change: RowChange): Promise<void> {}
}

describe(registerChangeConsumers, () => {
  beforeEach(() => {
    CHANGE_CONSUMERS.clear();
  });

  it("watches a model by class name, its consumers in order and once each", () => {
    registerChangeConsumers([
      [Product, IndexConsumer],
      [Product, SegmentConsumer],
      [Product, IndexConsumer],
    ]);
    expect(CHANGE_CONSUMERS.get("Product")).toEqual({
      model: Product,
      consumers: [IndexConsumer, SegmentConsumer],
    });
  });

  it("refuses a second model class of the same name", () => {
    registerChangeConsumers([[Product, IndexConsumer]]);
    const Twin = class {};
    Object.defineProperty(Twin, "name", { value: "Product" });
    expect(() => registerChangeConsumers([[Twin, IndexConsumer]])).toThrow(
      /two models are named Product/,
    );
  });
});

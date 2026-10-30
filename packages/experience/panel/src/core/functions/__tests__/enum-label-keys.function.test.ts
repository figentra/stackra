/**
 * Stackra file contract:
 * Purpose: unit tests of `enumLabelKeys`: the model-and-field key comes before the field key, a nested or camelCase path
 *          takes its last segment in snake_case, and a value that is not a snake_case code has no keys.
 * Boundary: unit tier; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 decision 22.
 */
import { describe, expect, it } from "@stackra/testing";

import { enumLabelKeys } from "#core/functions/enum-label-keys.function";

describe("enumLabelKeys", () => {
  it("tries the model's field enum, then the field's", () => {
    expect(enumLabelKeys("orders.order", "status", "paid")).toEqual([
      "orders::enums.order_status.paid",
      "orders::enums.status.paid",
    ]);
  });

  it("takes the last segment of a nested camelCase path", () => {
    expect(enumLabelKeys("shipping.delivery_run", "stop.trackingState", "in_transit")).toEqual([
      "shipping::enums.delivery_run_tracking_state.in_transit",
      "shipping::enums.tracking_state.in_transit",
    ]);
  });

  it("has no keys for free text", () => {
    expect(enumLabelKeys("orders.order", "note", "Leave at the door")).toEqual([]);
    expect(enumLabelKeys("orders.order", "sku", "SKU-1")).toEqual([]);
  });
});

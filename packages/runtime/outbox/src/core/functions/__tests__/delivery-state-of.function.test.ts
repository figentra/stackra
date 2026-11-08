/**
 * Stackra file contract:
 * Purpose: unit tests of `deliveryStateOf`: pending before an attempt, failing after one, dead once dead-lettered.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0511 (decision 17).
 */
import { describe, expect, it } from "@stackra/testing";

import { DeliveryState } from "#contracts/index";
import { DELIVERY_NOON, deliveryOf } from "#core/__tests__/fixtures/delivery.fixture";
import { deliveryStateOf } from "#core/functions/delivery-state-of.function";

describe(deliveryStateOf, () => {
  it("reads the state from attempts and the dead time", () => {
    expect(deliveryStateOf(deliveryOf())).toBe(DeliveryState.Pending);
    expect(deliveryStateOf(deliveryOf({ attempts: 2 }))).toBe(DeliveryState.Failing);
    expect(deliveryStateOf(deliveryOf({ attempts: 2, deadAt: DELIVERY_NOON }))).toBe(
      DeliveryState.Dead,
    );
  });
});

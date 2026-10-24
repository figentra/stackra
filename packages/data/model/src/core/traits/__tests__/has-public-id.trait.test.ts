/**
 * Stackra file contract:
 * Purpose: unit tests of `HasPublicId`: a fresh, prefixed id per created row, a loaded row's id kept, the prefix
 *          recorded, and a bad prefix refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0135; ADR 0294 (decision 27).
 */
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { traitsOf } from "#core/functions/traits-of.function";
import { HasPublicId } from "#core/traits/has-public-id.trait";

class Order extends Model.with(HasPublicId("ord")) {}

describe(HasPublicId, () => {
  it("mints a different prefixed id for each created row", () => {
    const first = new Order();
    const second = new Order();
    expect(first.id).toMatch(/^ord_[0-9a-hjkmnp-tv-z]{26}$/);
    expect(second.id).not.toBe(first.id);
  });

  it("keeps a loaded row's id", () => {
    const loaded = Object.assign(Object.create(Order.prototype) as Order, {
      id: "ord_01jab3k4m5n6p7q8r9s0t1v2w3",
    });
    expect(loaded.id).toBe("ord_01jab3k4m5n6p7q8r9s0t1v2w3");
  });

  it("records the prefix", () => {
    expect(traitsOf(Order)).toEqual([{ name: "has_public_id", options: { prefix: "ord" } }]);
  });

  it("refuses a prefix that is not 2 to 6 lowercase letters", () => {
    expect(() => HasPublicId("o")).toThrow(TypeError);
    expect(() => HasPublicId("orders1")).toThrow(TypeError);
    expect(() => HasPublicId("ORD")).toThrow(TypeError);
  });
});

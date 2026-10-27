/**
 * Stackra file contract:
 * Purpose: unit tests of `@Index`: several indexes per model read back in source order, frozen, with their options;
 *          refused with no property, on a field, or on a class that is not a model.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 6 and 27).
 */
import type { AnyClass } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { Index } from "#core/decorators/index.decorator";

@Index(["customerId"])
@Index(["scopeId", "memberId"], {
  unique: true,
  where: "deleted_at is null",
})
@Index(["scopeId", "total.minor"])
class Order extends Model.with() {
  scopeId!: string;

  customerId!: string;

  memberId!: string;
}

describe(Index, () => {
  it("reads every index back in source order", () => {
    expect(Index.on(Order)).toEqual([
      { properties: ["customerId"], unique: false },
      { properties: ["scopeId", "memberId"], unique: true, where: "deleted_at is null" },
      { properties: ["scopeId", "total.minor"], unique: false },
    ]);
    expect(Object.isFrozen(Index.on(Order)[0])).toBe(true);
  });

  it("reads nothing from a model without indexes", () => {
    class Note extends Model.with() {}
    expect(Index.on(Note)).toEqual([]);
  });

  it("refuses an empty property list", () => {
    expect(() => Index([])).toThrow(TypeError);
  });

  it("refuses a field and a class that is not a model", () => {
    const decorate = Index(["id"]) as (target: object, property?: string) => void;
    expect(() => decorate(Order.prototype, "customerId")).toThrow(TypeError);
    class Plain {}
    expect(() => decorate(Plain as AnyClass)).toThrow(TypeError);
  });
});

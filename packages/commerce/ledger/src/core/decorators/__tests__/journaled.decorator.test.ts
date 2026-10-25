/**
 * Stackra file contract:
 * Purpose: unit tests of `@Journaled`: it records the frozen field map and floor on a model, a subclass reads its
 *          ancestor's, an undecorated model reads nothing, and it refuses a fractional floor and a class that is not a
 *          model.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 6).
 */
import { AppendOnly, Model } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { Journaled } from "#core/decorators/journaled.decorator";

describe("@Journaled", () => {
  it("records the field map and floor on a model, frozen, for it and its subclasses", () => {
    @Journaled({ account: "memberId", amount: "points", floor: 0 })
    class PointsEntry extends Model.with(AppendOnly) {}
    class BonusEntry extends PointsEntry {}
    class CashEntry extends Model.with(AppendOnly) {}

    expect(Journaled.on(PointsEntry)).toEqual({ account: "memberId", amount: "points", floor: 0 });
    expect(Object.isFrozen(Journaled.on(PointsEntry))).toBe(true);
    expect(Journaled.on(BonusEntry)).toBe(Journaled.on(PointsEntry));
    expect(Journaled.on(CashEntry)).toBeUndefined();
  });

  it("records the currency field", () => {
    @Journaled({ currency: "currency" })
    class MoneyEntry extends Model.with(AppendOnly) {}

    expect(Journaled.on(MoneyEntry)).toEqual({ currency: "currency" });
  });

  it("refuses a floor that is not a whole number", () => {
    expect(() => Journaled({ floor: 0.5 })).toThrow(RangeError);
  });

  it("marks models only", () => {
    expect(() => {
      @Journaled({ account: "memberId" })
      class NotAModel {}
      return NotAModel;
    }).toThrow(TypeError);
  });
});

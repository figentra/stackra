/**
 * Stackra file contract:
 * Purpose: unit tests of `Model`: `Model.with` composes traits in order into a class of the `model` kind, refuses a
 *          trait applied twice, keeps no constructor-made state, accepts the field decorators of @stackra/validation,
 *          and `record` keeps events beside the instance for the unit of work.
 * Boundary: test only; builds models with `new` only to inspect them, which application code never does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 16, 25 and 27).
 */
import { kindOf } from "@stackra/container";
import { DomainEvent, takeRecordedEvents } from "@stackra/events";
import { describe, expect, it } from "@stackra/testing";
import { Int, Str } from "@stackra/validation";

import { Model } from "#core/bases/model.base";
import { traitsOf } from "#core/functions/traits-of.function";
import { HasPublicId } from "#core/traits/has-public-id.trait";
import { Timestamps } from "#core/traits/timestamps.trait";
import { Versioned } from "#core/traits/versioned.trait";

class StockLow extends DomainEvent {}

class StockLevel extends Model.with(HasPublicId("stk"), Versioned, Timestamps) {
  @Str({ max: 64 })
  locationId!: string;

  @Int({ min: 0 })
  onHand = 0;

  get available(): number {
    return this.onHand;
  }
}

describe(Model, () => {
  it("composes the traits into a model-kind class", () => {
    const level = new StockLevel();
    expect(level).toBeInstanceOf(Model);
    expect(kindOf(StockLevel)?.kind).toBe("model");
    expect(level.id).toMatch(/^stk_[0-9a-hjkmnp-tv-z]{26}$/);
    expect(level.createdAt).toBeInstanceOf(Date);
    expect(level.onHand).toBe(0);
    expect(traitsOf(StockLevel).map((trait) => trait.name)).toEqual([
      "has_public_id",
      "versioned",
      "timestamps",
    ]);
  });

  it("gives a plain model with no traits", () => {
    class Note extends Model.with() {}
    expect(new Note()).toBeInstanceOf(Model);
    expect(traitsOf(Note)).toEqual([]);
  });

  it("refuses a trait applied twice", () => {
    expect(() => Model.with(HasPublicId("ord"), HasPublicId("ord"))).toThrow(TypeError);
  });

  it("keeps only data fields on the instance", () => {
    const level = new StockLevel();
    expect(Object.keys(level).sort()).toEqual(
      ["createdAt", "id", "locationId", "onHand", "updatedAt", "version"].sort(),
    );
  });

  it("records events beside the instance, in order", () => {
    const level = new StockLevel();
    const first = new StockLow();
    const second = new StockLow();
    level.record(first);
    level.record(second);
    expect(Object.keys(level)).not.toContain("events");
    expect(takeRecordedEvents(level)).toStrictEqual([first, second]);
    expect(takeRecordedEvents(level)).toEqual([]);
  });

  it("keeps a loaded row's values when the constructor does not run", () => {
    const loaded = Object.assign(Object.create(StockLevel.prototype) as StockLevel, {
      id: "stk_01jab3k4m5n6p7q8r9s0t1v2w3",
      onHand: 7,
    });
    expect(loaded.id).toBe("stk_01jab3k4m5n6p7q8r9s0t1v2w3");
    expect(loaded.available).toBe(7);
  });
});

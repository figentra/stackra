/**
 * Stackra file contract:
 * Purpose: proves factory builds plain data from values and index generators, applies overrides without calling the
 *          overridden generator, numbers `buildMany`, stays deterministic and refuses a bad count.
 * Boundary: plain objects only; the frozen clock comes from freezeClock, as a `*.fixture.ts` would use it.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 2); ADR 0022 (test placement).
 */
import { describe, expect, expectTypeOf, it, vi } from "@stackra/testing";
import { factory } from "#core/functions/factory.function";
import { freezeClock } from "#core/functions/freeze-clock.function";
import type { FixtureBuilder } from "#core/types/fixture-builder.type";

/** A port DTO like the template's PointsEntry. */
interface Entry {
  readonly memberId: string;
  readonly points: number;
  readonly reference: string;
  readonly at: Date;
  readonly note?: string;
}

const entry = factory<Entry>({
  memberId: "usr_1",
  points: 100,
  reference: (i) => `ord_${i}`,
  at: () => new Date(),
});

// @covers sta-348:FR-007
describe(factory, () => {
  it("builds from the defaults, with index 0 for build()", () => {
    freezeClock("2026-10-21T09:00:00Z");
    expect(entry.build()).toEqual({
      memberId: "usr_1",
      points: 100,
      reference: "ord_0",
      at: new Date("2026-10-21T09:00:00Z"),
    });
  });

  it("lets an override replace any field", () => {
    expect(entry.build({ points: -50, note: "refund" })).toMatchObject({
      points: -50,
      note: "refund",
      reference: "ord_0",
    });
  });

  it("does not call the generator of an overridden field", () => {
    const reference = vi.fn((i: number) => `ref_${i}`);
    const built = factory<Pick<Entry, "reference">>({ reference }).build({ reference: "fixed" });
    expect(built.reference).toBe("fixed");
    expect(reference).not.toHaveBeenCalled();
  });

  it("numbers buildMany from 0 and applies the overrides to each", () => {
    const many = entry.buildMany(3, { memberId: "usr_2" });
    expect(many.map((e) => e.reference)).toEqual(["ord_0", "ord_1", "ord_2"]);
    expect(many.every((e) => e.memberId === "usr_2")).toBe(true);
  });

  it("builds a fresh object each time", () => {
    expect(entry.build()).not.toBe(entry.build());
    expect(entry.build()).toEqual(entry.build());
  });

  it("returns no object for a count of 0 and refuses a negative or fractional count", () => {
    expect(entry.buildMany(0)).toEqual([]);
    expect(() => entry.buildMany(-1)).toThrow(RangeError);
    expect(() => entry.buildMany(1.5)).toThrow(RangeError);
  });

  it("types the builder by T and checks the defaults against it", () => {
    expectTypeOf(entry).toEqualTypeOf<FixtureBuilder<Entry>>();
    expectTypeOf(entry.build()).toEqualTypeOf<Entry>();
    // @ts-expect-error a default must match its field's type
    factory<Entry>({ memberId: 1, points: 1, reference: "r", at: () => new Date() });
    // @ts-expect-error a required field needs a default
    factory<Entry>({ memberId: "usr_1", points: 1, reference: "r" });
  });
});

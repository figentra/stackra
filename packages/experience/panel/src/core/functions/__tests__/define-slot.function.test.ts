/**
 * Stackra file contract:
 * Purpose: unit and type tests of `defineSlot` and `fillSlot`: a slot keeps its key, surface and cardinality (`one` by
 *          default), bad keys, surfaces and cardinalities are refused, a fill binds a component of the slot's props, a
 *          fill on another surface is refused, and a component of other props does not type-check.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0438.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { defineSlot } from "#core/functions/define-slot.function";
import { fillSlot } from "#core/functions/fill-slot.function";
import type { Slot } from "#core/types/slot.type";
import type { SlotCardinality } from "#core/types/slot-cardinality.type";

interface BrandPanelProps {
  readonly brand: string;
}

const BrandPanel = defineSlot<BrandPanelProps>({
  key: "auth.sign_in.brand_panel",
  surface: "console",
});

describe("defineSlot", () => {
  it("keeps the key and surface and defaults the cardinality to one", () => {
    expect(BrandPanel).toEqual({
      key: "auth.sign_in.brand_panel",
      surface: "console",
      cardinality: "one",
    });
    expect(Object.isFrozen(BrandPanel)).toBe(true);
    expect(
      defineSlot({ key: "auth.sign_in.footer", surface: "console", cardinality: "many" })
        .cardinality,
    ).toBe("many");
    expectTypeOf(BrandPanel).toEqualTypeOf<Slot<BrandPanelProps>>();
  });

  it("refuses a bad key, surface or cardinality", () => {
    expect(() => defineSlot({ key: "brand", surface: "console" })).toThrow(RangeError);
    expect(() => defineSlot({ key: "auth.sign-in.page", surface: "console" })).toThrow(RangeError);
    expect(() => defineSlot({ key: "auth.page", surface: "Console" })).toThrow(RangeError);
    expect(() =>
      defineSlot({ key: "auth.page", surface: "console", cardinality: "two" as SlotCardinality }),
    ).toThrow(RangeError);
  });
});

/** A component of the slot's props. */
const component = (props: BrandPanelProps): string => props.brand;

describe("fillSlot", () => {
  it("binds a component of the slot's props on its surface", () => {
    const fill = fillSlot(BrandPanel, component, { surface: "console" });
    expect(fill.slot).toBe(BrandPanel);
    expect(fill.component).toBe(component);
    expect(fill.surface).toBe("console");
    expect(Object.isFrozen(fill)).toBe(true);
  });

  it("refuses a fill on another surface", () => {
    expect(() => fillSlot(BrandPanel, component, { surface: "ops" })).toThrow(RangeError);
  });

  it("does not type-check a component of other props", () => {
    // @ts-expect-error the component needs a prop the slot does not give
    fillSlot(BrandPanel, (props: { readonly logo: URL }) => props.logo, { surface: "console" });
  });
});

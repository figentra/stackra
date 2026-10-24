/**
 * Stackra file contract:
 * Purpose: unit and type tests of `extension`: it builds a frozen inline implementer with order `0` by default,
 *          refuses a fractional order, and type-checks the slot name and the handler against the slot.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0305 (rules 23 and 25).
 */
import { describe, expect, it } from "@stackra/testing";

import { ExtensionPoint } from "#core/index";
import { extension } from "#testing/functions/extension.function";

class OrderExtensionPoint extends ExtensionPoint {
  readonly adjustTotals = ExtensionPoint.after<number, [currency: string]>();

  readonly verifyPlacement = ExtensionPoint.before<[draft: { lines: number }]>();
}

/** A discount of 500 minor units. */
const discount = (total: number) => total - 500;

describe(extension, () => {
  it("builds a frozen inline implementer", () => {
    const handle = discount;
    const built = extension(OrderExtensionPoint, "adjustTotals", { order: 10 }, handle);
    expect(built).toEqual({ point: OrderExtensionPoint, slot: "adjustTotals", order: 10, handle });
    expect(Object.isFrozen(built)).toBe(true);
    expect(extension(OrderExtensionPoint, "verifyPlacement", {}, (draft) => [draft]).order).toBe(0);
  });

  it("refuses a fractional order", () => {
    expect(() =>
      extension(OrderExtensionPoint, "adjustTotals", { order: 0.5 }, (total) => total),
    ).toThrow(TypeError);
  });

  it("checks the slot name and the handler", () => {
    expect(() =>
      // @ts-expect-error -- not a slot of the point
      extension(OrderExtensionPoint, "adjustTotal", {}, (total: number) => total),
    ).not.toThrow();
    expect(() =>
      // @ts-expect-error -- an after handler returns the slot's value type
      extension(OrderExtensionPoint, "adjustTotals", {}, (_total: number) => "x"),
    ).not.toThrow();
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of the reference helpers: `refOf` finds a reference only in an object whose one key is `$ref`;
 *          `lookupRef` walks own properties only; `resolveRefs` resolves references at any depth and, with
 *          `keepPending`, leaves an unresolved `results.*` reference for a dry run.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0122 (decision 3); ADR 0154.
 */
import { describe, expect, it } from "@stackra/testing";

import { lookupRef } from "#core/functions/lookup-ref.function";
import { refOf } from "#core/functions/ref-of.function";
import { resolveRefs } from "#core/functions/resolve-refs.function";

const ROOTS = {
  input: { orderId: "ord_1", phone: "+966500000000" },
  results: { quote: { total: 120 } },
};

describe(refOf, () => {
  it("reads only a lone $ref", () => {
    expect(refOf({ $ref: "input.orderId" })).toBe("input.orderId");
    expect(refOf({ $ref: "input.orderId", extra: 1 })).toBeUndefined();
    expect(refOf({ $ref: 1 })).toBeUndefined();
    expect(refOf(["input.orderId"])).toBeUndefined();
  });

  it("looks up own properties only", () => {
    expect(lookupRef("results.quote.total", ROOTS)).toBe(120);
    expect(lookupRef("input.constructor", ROOTS)).toBeUndefined();
    expect(lookupRef("results.missing.total", ROOTS)).toBeUndefined();
  });

  it("resolves references at any depth, keeping pending results for a dry run", () => {
    const input = {
      to: { $ref: "input.phone" },
      lines: [{ total: { $ref: "results.quote.total" } }],
      later: { $ref: "results.ship.trackingId" },
      text: "Paid",
    };
    expect(resolveRefs(input, ROOTS)).toEqual({
      to: "+966500000000",
      lines: [{ total: 120 }],
      later: undefined,
      text: "Paid",
    });
    expect(resolveRefs(input, ROOTS, true)).toMatchObject({
      later: { $ref: "results.ship.trackingId" },
    });
  });
});

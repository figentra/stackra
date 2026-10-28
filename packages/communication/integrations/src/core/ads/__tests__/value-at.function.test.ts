/**
 * Stackra file contract:
 * Purpose: unit tests of `valueAt`: a dotted path reads nested own properties, and a missing step, a primitive on the
 *          way or a prototype key is `undefined`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; analytics gap 12 (stackra-412).
 */
import { describe, expect, it } from "@stackra/testing";

import { valueAt } from "#core/ads/value-at.function";

describe(valueAt, () => {
  it("reads a nested own property", () => {
    expect(valueAt({ customer: { email: "a@b.example" } }, "customer.email")).toBe("a@b.example");
  });

  it.each([
    ["a missing step", { customer: {} }, "customer.email"],
    ["a primitive on the way", { customer: "x" }, "customer.email"],
    ["a prototype key", {}, "constructor"],
    ["no payload", null, "orderId"],
  ])("answers undefined for %s", (_case, payload, path) => {
    expect(valueAt(payload, path)).toBeUndefined();
  });
});

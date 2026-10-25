/**
 * Stackra file contract:
 * Purpose: unit tests of `canonicalEta`: upper-cased quoted names, quoted scalars, array names repeated, undefined
 *          skipped.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { canonicalEta } from "#core/functions/canonical-eta.function";

describe("canonicalEta", () => {
  it("serializes objects, arrays and scalars", () => {
    expect(canonicalEta({ a: 1, b: [{ c: "x" }, { c: "y" }] })).toBe('"A""1""B""B""C""x""B""C""y"');
  });

  it("writes null as an empty value and skips undefined", () => {
    expect(canonicalEta({ a: null, b: undefined, c: true })).toBe('"A""""C""true"');
  });
});

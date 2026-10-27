/**
 * Stackra file contract:
 * Purpose: unit tests of `signedFields`: values join in the listed order with nothing between them, a missing or null
 *          value is empty, booleans are `true`/`false`, a `decimals` path is fixed to its places (numbers and numeric
 *          text), and an object, an array or a non-numeric decimal answers `undefined`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0308 (rule 15); STA-1357.
 */
import { describe, expect, it } from "@stackra/testing";

import { signedFields } from "#core/functions/signed-fields.function";

describe(signedFields, () => {
  it("joins the values in order", () => {
    const payload = { obj: { id: 7, ok: true, gone: null, text: "a" } };
    expect(signedFields(payload, ["obj.text", "obj.missing", "obj.gone", "obj.id", "obj.ok"])).toBe(
      "a7true",
    );
  });

  it("fixes the decimals of the paths named", () => {
    expect(signedFields({ a: 100, b: "5.5" }, ["a", "b"], { a: 2, b: 2 })).toBe("100.005.50");
  });

  it("answers undefined for an object, an array or a non-numeric decimal", () => {
    expect(signedFields({ a: { b: 1 } }, ["a"])).toBeUndefined();
    expect(signedFields({ a: [1] }, ["a"])).toBeUndefined();
    expect(signedFields({ a: "x" }, ["a"], { a: 2 })).toBeUndefined();
  });
});

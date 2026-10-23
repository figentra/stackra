/**
 * Stackra file contract:
 * Purpose: proves `omitUndefined` removes the keys whose value is `undefined`, keeps every other value (false, 0 and
 *          the empty string included) and does not change its input.
 * Boundary: pure function.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement).
 */
// @covers sta-350:FR-022
import { omitUndefined } from "#core/functions/omit-undefined.function";

describe("omitUndefined", () => {
  it("removes the keys whose value is undefined", () => {
    const result = omitUndefined({ a: 1, b: undefined, c: "x" });
    expect(result).toEqual({ a: 1, c: "x" });
    expect(Object.keys(result)).toEqual(["a", "c"]);
  });

  it("keeps falsy values that are not undefined", () => {
    expect(omitUndefined({ a: false, b: 0, c: "", d: null })).toEqual({
      a: false,
      b: 0,
      c: "",
      d: null,
    });
  });

  it("copies instead of changing its input", () => {
    const input = { a: undefined, b: 1 };
    omitUndefined(input);
    expect(Object.keys(input)).toEqual(["a", "b"]);
  });

  it("types the kept keys without undefined", () => {
    const result = omitUndefined({ a: 1 as number | undefined });
    expectTypeOf(result).toEqualTypeOf<{ a: number }>();
  });
});

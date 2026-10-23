/**
 * Stackra file contract:
 * Purpose: proves `omitUndefined` removes only the keys whose value is `undefined` and leaves every other value,
 *          falsy ones included, untouched.
 * Boundary: unit; pure function.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0022 (test placement).
 */
import { omitUndefined } from "#core/functions/omit-undefined.function";

describe("omitUndefined", () => {
  it("drops undefined values and keeps the falsy ones", () => {
    const result = omitUndefined({ a: undefined, b: false, c: 0, d: "", e: null, f: "x" });
    expect(result).toEqual({ b: false, c: 0, d: "", e: null, f: "x" });
    expect("a" in result).toBe(false);
  });

  it("returns a copy, never the same object", () => {
    const props = { a: 1 };
    expect(omitUndefined(props)).not.toBe(props);
  });
});

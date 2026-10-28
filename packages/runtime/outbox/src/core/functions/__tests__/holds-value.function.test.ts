/**
 * Stackra file contract:
 * Purpose: unit tests of `holdsValue`: a string found as a value at any depth, in arrays and objects; never a key,
 *          never a substring, never a non-string.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0189 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { holdsValue } from "#core/functions/holds-value.function";

describe(holdsValue, () => {
  it("finds the value at any depth", () => {
    expect(holdsValue("usr_1", "usr_1")).toBe(true);
    expect(holdsValue({ a: { b: [1, { c: "usr_1" }] } }, "usr_1")).toBe(true);
  });

  it("ignores keys, substrings and other types", () => {
    expect(holdsValue({ usr_1: 1 }, "usr_1")).toBe(false);
    expect(holdsValue({ a: "usr_12" }, "usr_1")).toBe(false);
    expect(holdsValue({ a: 1, b: null, c: true }, "1")).toBe(false);
  });
});

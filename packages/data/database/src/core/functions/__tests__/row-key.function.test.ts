/**
 * Stackra file contract:
 * Purpose: unit tests of `rowKey`: values, dates and linked rows key the same on an input row and a stored one, the
 *          field order counts, and a missing or null field gives no key.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: data-layer gap mo9 (stackra-280); ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { rowKey } from "#core/functions/row-key.function";

describe("rowKey", () => {
  it("keys values, dates and linked rows", () => {
    const at = new Date("2026-10-28T00:00:00Z");
    expect(rowKey({ code: "A", n: 2, on: at }, ["code", "n", "on"])).toBe(
      JSON.stringify(["A", "2", at.toISOString()]),
    );
    expect(rowKey({ customer: { id: "cus_1" } }, ["customer"])).toBe(
      rowKey({ customer: "cus_1" }, ["customer"]),
    );
    expect(rowKey({ a: "1", b: "2" }, ["a", "b"])).not.toBe(rowKey({ a: "1", b: "2" }, ["b", "a"]));
  });

  it("gives no key when a field is missing or null", () => {
    expect(rowKey({ code: null }, ["code"])).toBeUndefined();
    expect(rowKey({}, ["code"])).toBeUndefined();
    expect(rowKey({ customer: { id: null } }, ["customer"])).toBeUndefined();
  });
});

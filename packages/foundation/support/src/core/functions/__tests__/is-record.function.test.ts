/**
 * Stackra file contract:
 * Purpose: unit tests of `isRecord`: objects count; `null`, arrays and primitives do not; with `keys`, an object with
 *          a key outside them does not.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; stackra-224 (moved from licensing, keys
 *                     case from rules).
 */
import { describe, expect, it } from "@stackra/testing";

import { isRecord } from "#core/functions/is-record.function";

describe("isRecord", () => {
  it("accepts a plain object", () => {
    expect(isRecord({ a: 1 })).toBe(true);
  });

  it("refuses null, arrays and primitives", () => {
    expect(isRecord(null)).toBe(false);
    expect(isRecord([1])).toBe(false);
    expect(isRecord("a")).toBe(false);
    expect(isRecord(undefined)).toBe(false);
  });

  it("refuses an object with a key outside `keys`", () => {
    expect(isRecord({ op: "eq", value: 1 }, ["op", "value"])).toBe(true);
    expect(isRecord({}, ["op"])).toBe(true);
    expect(isRecord({ op: "eq", extra: 1 }, ["op", "value"])).toBe(false);
  });
});

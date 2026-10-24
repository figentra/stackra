/**
 * Stackra file contract:
 * Purpose: unit tests of `isRecord`: objects count; `null`, arrays and primitives do not.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269.
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
});

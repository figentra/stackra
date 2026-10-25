/**
 * Stackra file contract:
 * Purpose: unit tests of `changeOf`: the change ratio, and null without a value, a previous value or with a zero previous.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 15).
 */
import { describe, expect, it } from "@stackra/testing";

import { changeOf } from "#core/functions/change-of.function";

describe("changeOf", () => {
  it("returns the change ratio or null", () => {
    expect(changeOf({ value: 5_000, previous: 4_000 })).toBe(0.25);
    expect(changeOf({ value: 1, previous: 2 })).toBe(-0.5);
    expect(changeOf({ value: 1, previous: 0 })).toBeNull();
    expect(changeOf({ value: null, previous: 1 })).toBeNull();
    expect(changeOf({ value: 1, previous: null })).toBeNull();
  });
});

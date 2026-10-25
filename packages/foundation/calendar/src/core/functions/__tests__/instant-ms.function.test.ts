/**
 * Stackra file contract:
 * Purpose: unit tests of `instantMs`: instants with `Z` or an offset, and refusals.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366.
 */
import { describe, expect, it } from "@stackra/testing";

import { instantMs } from "#core/functions/instant-ms.function";

describe("instantMs", () => {
  it("reads an instant with an offset", () => {
    expect(instantMs("1970-01-01T00:00:01Z")).toBe(1000);
    expect(instantMs("1970-01-01T03:00+03:00")).toBe(0);
  });

  it.each(["1970-01-01T00:00:00", "1970-01-01", "now"])("refuses %j", (instant) => {
    expect(() => instantMs(instant)).toThrow(RangeError);
  });
});

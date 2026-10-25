/**
 * Stackra file contract:
 * Purpose: unit tests of `localDateOf`: the local business day of an instant on either side of local midnight.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366.
 */
import { describe, expect, it } from "@stackra/testing";

import { localDateOf } from "#core/functions/local-date-of.function";

describe("localDateOf", () => {
  it("reads the local date", () => {
    expect(localDateOf("2026-01-04T20:59:59Z", "Asia/Riyadh")).toBe("2026-01-04");
    expect(localDateOf("2026-01-04T21:00:00Z", "Asia/Riyadh")).toBe("2026-01-05");
    expect(localDateOf("2026-01-05T01:00:00+03:00", "UTC")).toBe("2026-01-04");
  });

  it("refuses an instant without an offset", () => {
    expect(() => localDateOf("2026-01-04T21:00:00", "UTC")).toThrow(RangeError);
  });
});

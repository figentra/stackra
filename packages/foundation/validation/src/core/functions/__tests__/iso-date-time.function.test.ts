/**
 * Stackra file contract:
 * Purpose: unit and type tests of `isoDateTime()`: ISO 8601 with an offset decodes to a `Date` and encodes back, a
 *          time without an offset is refused, a valid `Date` passes and an invalid one fails, and the output is `Date`.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 26).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { z } from "zod";

import { isoDateTime } from "#core/functions/iso-date-time.function";

describe("isoDateTime()", () => {
  it("decodes ISO 8601 with an offset to the same instant", () => {
    const date = isoDateTime().parse("2026-10-24T10:00:00+03:00");
    expect(date).toBeInstanceOf(Date);
    expect(date.toISOString()).toBe("2026-10-24T07:00:00.000Z");
    expect(isoDateTime().parse("2026-10-24T07:00:00Z").getTime()).toBe(date.getTime());
  });

  it("encodes a Date to ISO 8601 in UTC", () => {
    expect(z.encode(isoDateTime(), new Date(Date.UTC(2026, 9, 24, 7)))).toBe(
      "2026-10-24T07:00:00.000Z",
    );
  });

  it("round-trips a wire value to the same instant", () => {
    const wire = "2027-03-01T23:59:59.250-05:00";
    const back = z.encode(isoDateTime(), isoDateTime().parse(wire));
    expect(new Date(back as string).getTime()).toBe(new Date(wire).getTime());
  });

  it.each(["2026-10-24T10:00:00", "2026-10-24", "yesterday", 1_729_760_400_000, null])(
    "refuses %j",
    (wire) => {
      expect(isoDateTime().safeParse(wire).success).toBe(false);
    },
  );

  it("accepts a Date in hand and refuses an invalid one", () => {
    const now = new Date();
    expect(isoDateTime().parse(now)).toBe(now);
    expect(isoDateTime().safeParse(new Date(Number.NaN)).success).toBe(false);
  });

  it("outputs a Date, also when nullable", () => {
    expectTypeOf<z.output<ReturnType<typeof isoDateTime>>>().toEqualTypeOf<Date>();
    expect(isoDateTime().nullable().parse(null)).toBeNull();
  });
});

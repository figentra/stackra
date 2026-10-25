/**
 * Stackra file contract:
 * Purpose: unit and type tests of `tableInput({ sort, filters })`: the caller's view of a narrowed table input takes
 *          the declared sort keys and filters only, defaults the limit to 20, and leaves sort and filter optional.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 26);
 *                     ADR 0307 (resource tables).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { z } from "zod";

import { isoDateTime } from "#core/functions/iso-date-time.function";
import { tableInput } from "#core/functions/table-input.function";

const ListOrdersInput$ = tableInput({
  sort: ["totals.totalMinor", "createdAt"],
  filters: z.object({
    status: z.array(z.enum(["pending_payment", "paid"])).exactOptional(),
    createdAt: z.object({ from: isoDateTime(), to: isoDateTime() }).exactOptional(),
  }),
});

describe("tableInput()", () => {
  it("defaults the limit and leaves sort and filter optional", () => {
    expect(ListOrdersInput$.parse({})).toEqual({ limit: 20 });
  });

  it("accepts a declared sort key and filter", () => {
    const parsed = ListOrdersInput$.parse({
      limit: 100,
      sort: { key: "createdAt", direction: "asc" },
      filter: { status: ["paid"] },
    });
    expect(parsed.sort).toEqual({ key: "createdAt", direction: "asc" });
    expect(parsed.filter).toEqual({ status: ["paid"] });
  });

  it("refuses an undeclared sort key, a bad filter and a page size outside 20, 50 and 100", () => {
    expect(ListOrdersInput$.safeParse({ sort: { key: "paidAt", direction: "asc" } }).success).toBe(
      false,
    );
    expect(ListOrdersInput$.safeParse({ filter: { status: ["shipped"] } }).success).toBe(false);
    expect(ListOrdersInput$.safeParse({ limit: 30 }).success).toBe(false);
  });

  it("types the sort keys and the filter shape", () => {
    type Output = z.output<typeof ListOrdersInput$>;
    expectTypeOf<NonNullable<Output["sort"]>["key"]>().toEqualTypeOf<
      "totals.totalMinor" | "createdAt"
    >();
    expectTypeOf<Output["limit"]>().toEqualTypeOf<20 | 50 | 100>();
  });
});

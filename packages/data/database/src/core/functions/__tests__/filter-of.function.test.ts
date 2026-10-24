/**
 * Stackra file contract:
 * Purpose: unit tests of the internal `filterOf` and `columnOf`: a `$raw` fragment becomes its own key and the rest is
 *          unchanged; a scalar or embedded path resolves to its column and anything else is refused.
 * Boundary: test only; the metadata is a hand-made stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0160 (decision 1); ADR 0022; ADR 0269.
 */
import type { EntityMetadata } from "@mikro-orm/core";
import { describe, expect, it } from "@stackra/testing";

import { columnOf } from "#core/functions/column-of.function";
import { filterOf } from "#core/functions/filter-of.function";
import { sql } from "#core/functions/sql.function";

const meta = {
  className: "Order",
  properties: {
    paidAt: { fieldNames: ["paid_at"] },
    total: { embeddedProps: { minor: { fieldNames: ["total_minor"] } } },
  },
} as unknown as EntityMetadata;

describe(filterOf, () => {
  it("turns $raw into a raw key and keeps the rest", () => {
    const raw = sql`x > ${1}`;
    expect(filterOf<{ status: string }>({ status: "paid", $raw: raw })).toEqual({
      status: "paid",
      [raw.key]: [],
    });
    expect(filterOf<{ status: string }>({ status: "paid" })).toEqual({ status: "paid" });
  });

  it("resolves scalar and embedded paths to columns", () => {
    expect(columnOf(meta, "paidAt")).toBe("paid_at");
    expect(columnOf(meta, "total.minor")).toBe("total_minor");
    expect(() => columnOf(meta, "total")).toThrow(/not a single-column field/);
  });
});

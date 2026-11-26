/**
 * Stackra file contract:
 * Purpose: unit tests of `tablePageOf`: rows with their ids (or their place), the next cursor only while more rows
 *          exist, the count, and an empty page for no answer.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 1 and 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { tablePageOf } from "#core/functions/table-page-of.function";

describe("tablePageOf", () => {
  it("reads the rows, the cursor and the count", () => {
    const page = tablePageOf({
      items: [{ id: "ord_1" }, { name: "x" }],
      hasMore: true,
      nextCursor: "c2",
      count: { value: 2, capped: false },
    });
    expect(page.rows).toEqual([{ id: "ord_1" }, { name: "x", id: "1" }]);
    expect(page.nextCursor).toBe("c2");
    expect(page.count).toEqual({ value: 2, capped: false });
    expect(tablePageOf({ items: [], nextCursor: "c2" }).nextCursor).toBeNull();
    expect(tablePageOf(undefined)).toEqual({ rows: [], nextCursor: null, count: undefined });
  });
});

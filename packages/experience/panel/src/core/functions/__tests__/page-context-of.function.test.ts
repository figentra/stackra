/**
 * Stackra file contract:
 * Purpose: unit tests of `pageContextOf`: a record page publishes its id, a list page its filters (the search text as
 *          `search`, empty and non-plain values left out) and its selection cut to 200 ids with the full count, and a
 *          page with nothing publishes nothing.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0490 (decision 5); STA-1631.
 */
import { describe, expect, it } from "@stackra/testing";

import { pageContextOf } from "#core/functions/page-context-of.function";

describe(pageContextOf, () => {
  it("publishes the record id of a record page", () => {
    expect(pageContextOf(undefined, "ord_01h2j3k4l5m6n7p8q9r0s1t2v3", undefined)).toEqual({
      record: "ord_01h2j3k4l5m6n7p8q9r0s1t2v3",
    });
  });

  it("publishes the list's search and plain filters only", () => {
    expect(
      pageContextOf(
        {
          search: "shirt",
          filters: {
            status: "open",
            paid: false,
            tags: ["a"],
            empty: "",
            none: [],
            nested: { a: 1 },
          },
        },
        undefined,
        undefined,
      ),
    ).toEqual({ filters: { search: "shirt", status: "open", paid: false, tags: ["a"] } });
  });

  it("cuts a selection to 200 ids and keeps the full count", () => {
    const ids = Array.from({ length: 250 }, (_, index) => `ord_${String(index)}`);
    const context = pageContextOf(undefined, undefined, ids);
    expect(context.selection?.ids).toHaveLength(200);
    expect(context.selection?.count).toBe(250);
  });

  it("publishes nothing for a page with nothing to say", () => {
    expect(pageContextOf({ search: "", filters: {} }, undefined, [])).toEqual({});
  });
});

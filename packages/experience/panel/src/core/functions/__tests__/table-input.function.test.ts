/**
 * Stackra file contract:
 * Purpose: unit tests of `tableInput`: the closed list input keeps declared filters (operator kinds in wire form, empty
 *          ones dropped), a sortable column's sort (else the default sort with its tiebreak keys), a trimmed search and
 *          the cursor, and passes everything when no table is recorded; a fixed input sits under the user's state,
 *          its filter merged one level (STA-1688).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 2); reporting gap 5.
 */
import { SortDirection } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Count } from "#core/enums/count.enum";
import { tableInput } from "#core/functions/table-input.function";
import type { TableNode } from "#core/types/table-node.type";

const table: TableNode = {
  columns: [
    { kind: "value", key: "status" },
    { kind: "value", key: "createdAt", sortable: true },
  ],
  filters: [{ kind: "value", key: "status" }, { kind: "trashed" }],
  defaultSort: { key: "createdAt", direction: SortDirection.Desc },
  count: Count.Estimated,
};

describe("tableInput", () => {
  it("keeps declared filters, a sortable sort, the search and the cursor", () => {
    expect(
      tableInput(table, {
        search: "  ada ",
        filters: { status: "paid", trashed: "only", secret: 1, empty: undefined },
        sort: { key: "createdAt", direction: SortDirection.Asc },
        cursor: "c2",
        limit: 25,
      }),
    ).toEqual({
      limit: 25,
      cursor: "c2",
      sort: { key: "createdAt", direction: SortDirection.Asc },
      filter: { status: "paid", trashed: "only" },
      search: "ada",
    });
  });

  it("falls back to the default sort for an unsortable column and drops an empty search", () => {
    expect(
      tableInput(table, {
        search: " ",
        filters: {},
        sort: { key: "status", direction: SortDirection.Asc },
        limit: 10,
      }),
    ).toEqual({ limit: 10, sort: { key: "createdAt", direction: SortDirection.Desc } });
  });

  it("sends operator filters in wire form and the default sort with its tiebreak keys", () => {
    const multi: TableNode = {
      ...table,
      filters: [
        { kind: "range", key: "total" },
        { kind: "contains", key: "name" },
      ],
      thenSort: [{ key: "id", direction: SortDirection.Asc }],
    };
    expect(
      tableInput(multi, {
        search: "",
        filters: { total: { min: 5, max: null }, name: " " },
        sort: null,
        limit: 20,
      }),
    ).toEqual({
      limit: 20,
      sort: [
        { key: "createdAt", direction: SortDirection.Desc },
        { key: "id", direction: SortDirection.Asc },
      ],
      filter: { total: { op: "range", from: 5 } },
    });
  });

  it("passes every value through without a recorded table", () => {
    expect(
      tableInput(undefined, {
        search: "",
        filters: { tier: "gold" },
        sort: { key: "name", direction: SortDirection.Asc },
        limit: 5,
      }),
    ).toEqual({
      limit: 5,
      sort: { key: "name", direction: SortDirection.Asc },
      filter: { tier: "gold" },
    });
  });

  it("sends a fixed input under the user's state, merging a fixed filter one level", () => {
    expect(
      tableInput(
        table,
        { search: "", filters: { status: "paid" }, sort: null, limit: 25, cursor: "c2" },
        {
          includeMerged: true,
          limit: 500,
          cursor: "stale",
          filter: { status: "open", tier: "gold" },
        },
      ),
    ).toEqual({
      includeMerged: true,
      limit: 25,
      cursor: "c2",
      sort: { key: "createdAt", direction: SortDirection.Desc },
      filter: { status: "paid", tier: "gold" },
    });
    expect(
      tableInput(
        table,
        { search: "", filters: {}, sort: null, limit: 25 },
        { filter: { tier: "gold" } },
      ),
    ).toMatchObject({ filter: { tier: "gold" } });
  });
});

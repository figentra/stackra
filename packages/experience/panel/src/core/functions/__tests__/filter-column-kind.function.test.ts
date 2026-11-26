/**
 * Stackra file contract:
 * Purpose: unit tests of `filterColumnKind` and `placeFilterColumn`: each filter kind's column type, and a filter
 *          merged into its shown column or added hidden with its label.
 * Boundary: test only; translation returns the key.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 9 and 11).
 */
import type { I18nKey } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";
import type { CollectionColumn } from "@stackra/ui/contracts";

import { filterColumnKind } from "#core/functions/filter-column-kind.function";
import { placeFilterColumn } from "#core/functions/place-filter-column.function";

const t = (key: I18nKey): string => key;

describe("filterColumnKind", () => {
  it("types each filter kind", () => {
    expect(filterColumnKind({ kind: "trashed" }, undefined, t).type).toBe("choice");
    expect(filterColumnKind({ kind: "range", key: "total" }, undefined, t)).toEqual({
      type: "number",
    });
    expect(filterColumnKind({ kind: "dateRange", key: "at" }, undefined, t)).toEqual({
      type: "date",
    });
    expect(filterColumnKind({ kind: "isNull", key: "at" }, undefined, t)).toEqual({
      type: "boolean",
    });
    expect(filterColumnKind({ kind: "value", key: "note" }, undefined, t)).toEqual({
      type: "text",
    });
    const options = [{ id: "paid", label: "Paid" }];
    expect(filterColumnKind({ kind: "value", key: "status" }, options, t)).toEqual({
      type: "choice",
      options,
    });
  });
});

describe("placeFilterColumn", () => {
  it("merges into a shown column, or adds a hidden one", () => {
    const columns: CollectionColumn[] = [{ id: "status", label: "Status", isFilterable: false }];
    placeFilterColumn(columns, "status", () => "unused", { type: "text" });
    placeFilterColumn(columns, "total", () => "Total", { type: "number" });
    expect(columns).toEqual([
      { id: "status", label: "Status", isFilterable: true, type: "text" },
      { id: "total", label: "Total", isHidden: true, type: "number" },
    ]);
  });
});

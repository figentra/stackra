/**
 * Stackra file contract:
 * Purpose: proves `collectionSelectionOf()`: the selected ids as they are, every matching id when "all matching" is
 *          chosen in client mode, and in server mode a descriptor of the search, filter and total, never ids.
 * Boundary: the pure function alone.
 * Runtime: node
 * Governing contract: data-collection plan (owner, 2026-10-29), wave 3 (select all across pages); ADR 0022 (test
 *          placement); STA-1371.
 */
import type { CollectionColumn } from "#contracts/types/collection-column.type";
import { collectionSelectionOf } from "#core/functions/collection-selection-of.function";
import { defaultCollectionStateOf } from "#core/functions/default-collection-state-of.function";

const COLUMNS: readonly CollectionColumn[] = [{ id: "name", label: "Name" }];
const MATCHED = [{ id: "a" }, { id: "b" }, { id: "c" }];
const FILTER = {
  match: "all" as const,
  conditions: [{ id: "c1", field: "name", operator: "contains" as const, value: "a" }],
};

describe("collectionSelectionOf", () => {
  const base = {
    ...defaultCollectionStateOf(COLUMNS),
    selection: ["a"],
    search: "x",
    filter: FILTER,
  };

  it("answers the selected ids while only some rows are chosen, in either mode", () => {
    expect(collectionSelectionOf(base, "client", MATCHED, 3)).toEqual({ kind: "ids", ids: ["a"] });
    expect(collectionSelectionOf(base, "server", MATCHED, 300)).toEqual({
      kind: "ids",
      ids: ["a"],
    });
  });

  it("answers every matching id across pages when all matching rows are chosen in client mode", () => {
    const state = { ...base, isAllMatchingSelected: true };
    expect(collectionSelectionOf(state, "client", MATCHED, 3)).toEqual({
      kind: "ids",
      ids: ["a", "b", "c"],
    });
  });

  it("answers a descriptor, not ids, when all matching rows are chosen in server mode", () => {
    const state = { ...base, isAllMatchingSelected: true };
    expect(collectionSelectionOf(state, "server", MATCHED, 300)).toEqual({
      kind: "all-matching",
      search: "x",
      filter: FILTER,
      totalCount: 300,
      except: [],
    });
  });

  it("leaves out the rows unticked after all matching rows were chosen, in either mode", () => {
    const state = { ...base, isAllMatchingSelected: true, excludedKeys: ["b"] };
    expect(collectionSelectionOf(state, "client", MATCHED, 3)).toEqual({
      kind: "ids",
      ids: ["a", "c"],
    });
    expect(collectionSelectionOf(state, "server", MATCHED, 300)).toMatchObject({
      kind: "all-matching",
      except: ["b"],
    });
  });
});

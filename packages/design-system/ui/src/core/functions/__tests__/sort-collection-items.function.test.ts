/**
 * Stackra file contract:
 * Purpose: proves `sortCollectionItems` on its edges: no sort returns the same list, dates compare by time, empty
 *          values stay last both ways and two empties fall through to the next key, descending reverses, and ties
 *          keep the input order.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0022 (test placement); STA-1371.
 */
import { sortCollectionItems } from "#core/functions/sort-collection-items.function";

const ROWS = [
  { id: "a", at: new Date("2026-03-01"), city: "", rank: 2 },
  { id: "b", at: new Date("2026-01-01"), city: "جدة", rank: 1 },
  { id: "c", at: null, city: "", rank: 1 },
  { id: "d", at: new Date("2026-02-01"), city: "Riyadh", rank: 1 },
];
const ids = (rows: readonly { readonly id: string }[]) => rows.map((row) => row.id);

describe("sortCollectionItems", () => {
  it("returns the same list with no sort", () => {
    expect(sortCollectionItems(ROWS, [], "en")).toBe(ROWS);
  });

  it("orders dates by time with empties last, either direction", () => {
    expect(
      ids(sortCollectionItems(ROWS, [{ column: "at", direction: "ascending" }], "en")),
    ).toEqual(["b", "d", "a", "c"]);
    expect(
      ids(sortCollectionItems(ROWS, [{ column: "at", direction: "descending" }], "en")),
    ).toEqual(["a", "d", "b", "c"]);
  });

  it("falls through two empties to the next key, and keeps ties in input order", () => {
    expect(
      ids(
        sortCollectionItems(
          ROWS,
          [
            { column: "city", direction: "ascending" },
            { column: "rank", direction: "descending" },
          ],
          "en",
        ),
      ),
    ).toEqual(["d", "b", "a", "c"]);
    expect(
      ids(sortCollectionItems(ROWS, [{ column: "rank", direction: "ascending" }], "en")),
    ).toEqual(["b", "c", "d", "a"]);
  });
});

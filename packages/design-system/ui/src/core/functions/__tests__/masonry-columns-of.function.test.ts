/**
 * Stackra file contract:
 * Purpose: proves `masonryColumnsOf` puts each picture in the shortest column, keeps the input positions, and treats
 *          a picture of unknown size as a square.
 * Boundary: pure function; no rendering.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371.
 */
import { masonryColumnsOf } from "#core/functions/masonry-columns-of.function";

describe("masonryColumnsOf", () => {
  it("deals each picture to the shortest column", () => {
    const columns = masonryColumnsOf(
      [
        { id: "tall", src: "/t", alt: "", width: 100, height: 300 },
        { id: "a", src: "/a", alt: "" },
        { id: "b", src: "/b", alt: "" },
        { id: "c", src: "/c", alt: "" },
      ],
      2,
    );
    expect(columns.map((column) => column.map(({ image }) => image.id))).toEqual([
      ["tall"],
      ["a", "b", "c"],
    ]);
    expect(columns[1]?.map(({ position }) => position)).toEqual([1, 2, 3]);
  });
});

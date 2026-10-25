/**
 * Stackra file contract:
 * Purpose: `pathOfStrokes(strokes)`, a drawn signature's strokes as SVG path data: one `M` per stroke and an `L` per
 *          further point, rounded to a tenth of a unit; a single tap is a dot.
 * Boundary: internal; pure. Empty strokes are skipped.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3).
 */

/** `value` rounded to one decimal, without a trailing `.0`. */
const unit = (value: number): string => String(Math.round(value * 10) / 10);

/**
 * The path data of `strokes`.
 *
 * @example
 * pathOfStrokes([[[1, 2], [3, 4.25]]]); // "M1 2L3 4.3"
 */
export function pathOfStrokes(
  strokes: readonly (readonly (readonly [number, number])[])[],
): string {
  return strokes
    .filter((stroke) => stroke.length > 0)
    .map((stroke) => {
      const [[x, y] = [0, 0], ...rest] = stroke;
      const tail = rest.length === 0 ? [[x + 0.1, y] as const] : rest;
      return `M${unit(x)} ${unit(y)}${tail.map(([px, py]) => `L${unit(px)} ${unit(py)}`).join("")}`;
    })
    .join("");
}

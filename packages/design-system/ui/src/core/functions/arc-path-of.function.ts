/**
 * Stackra file contract:
 * Purpose: `arcPathOf`, the SVG path of a ring slice (or a pie wedge when `inner` is 0) from `start` to `end`, angles
 *          in radians measured clockwise from the top. Web SVG draws it as `d`; native Skia's `<Path path>` reads the
 *          same string.
 * Boundary: pure; numbers rounded to two decimals so the strings stay short.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: the same geometry on web and native); STA-1371.
 */

/** A point at `angle` (clockwise from the top) and `radius` round the centre. */
const at = (cx: number, cy: number, radius: number, angle: number) =>
  `${(cx + radius * Math.sin(angle)).toFixed(2)} ${(cy - radius * Math.cos(angle)).toFixed(2)}`;

/**
 * The slice between two radii and two angles.
 * @example arcPathOf(50, 50, 0, 40, 0, Math.PI / 2); // "M 50.00 50.00 L 50.00 10.00 A 40 40 0 0 1 90.00 50.00 Z"
 */
export function arcPathOf(
  cx: number,
  cy: number,
  inner: number,
  outer: number,
  start: number,
  end: number,
): string {
  const sweep = Math.min(end - start, Math.PI * 2 - 1e-4);
  const stop = start + sweep;
  const large = sweep > Math.PI ? 1 : 0;
  const outerArc = `M ${at(cx, cy, outer, start)} A ${outer} ${outer} 0 ${large} 1 ${at(cx, cy, outer, stop)}`;
  if (inner <= 0) return `M ${cx.toFixed(2)} ${cy.toFixed(2)} L ${outerArc.slice(2)} Z`;
  return `${outerArc} L ${at(cx, cy, inner, stop)} A ${inner} ${inner} 0 ${large} 0 ${at(cx, cy, inner, start)} Z`;
}

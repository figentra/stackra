/**
 * Stackra file contract:
 * Purpose: `CHART_SHADES`, the five opacities of one colour a sequential scale paints its levels in (a map region, a
 *          heat cell), lightest first, over the card's surface.
 * Boundary: values only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: the same shades on web and native); STA-1371.
 */

/** The fill opacity of each level, 0 to 4. */
export const CHART_SHADES = Object.freeze([0.22, 0.4, 0.58, 0.78, 1] as const);

/**
 * Stackra file contract:
 * Purpose: `ChartEmphasis`, which mark of a single-series chart carries the accent: the latest (last) one, none, or
 *          the one at an index. The other marks stand back in a soft tone of the same colour; the pointed or pressed
 *          mark takes the accent while it is pointed.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */

/** Which mark carries the accent. */
export type ChartEmphasis = "latest" | "none" | number;

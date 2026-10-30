/**
 * Stackra file contract:
 * Purpose: `ChartDatum`, one row of a chart's data: a category (a month, an ISO date, a browser) and one number per
 *          series, keyed by the series' `key`.
 * Boundary: types only. A missing or null number is a gap, never a zero.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0340 (decision 9: the chart set); STA-1371.
 */

/** One row of chart data. */
export type ChartDatum = Readonly<Record<string, string | number | null | undefined>>;

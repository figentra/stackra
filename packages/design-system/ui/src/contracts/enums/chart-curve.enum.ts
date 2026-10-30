/**
 * Stackra file contract:
 * Purpose: `ChartCurve`, how a line or area joins its points: a smooth monotone curve that never overshoots a
 *          value, a natural spline, straight segments or steps.
 * Boundary: names only; web maps them to Recharts' curve types, native to Victory Native's.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0340 (decision 9: the chart set); STA-1371.
 */

// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the curves carry no labels.
export const ChartCurve = Object.freeze(["monotone", "natural", "linear", "step"] as const);

/** One way of joining a series' points. */
export type ChartCurve = (typeof ChartCurve)[number];

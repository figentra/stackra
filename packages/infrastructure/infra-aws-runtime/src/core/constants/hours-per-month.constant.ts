/**
 * Stackra file contract:
 * Purpose: `HOURS_PER_MONTH`, the hours a month the cost estimate prices an always-on hourly resource at.
 * Boundary: data only; `runtimePlan` multiplies a GPU tool's hourly price by it. An estimate, not a bill.
 * Runtime: isomorphic
 * Governing contract: ADR 0493 (decision 3); STA-1662.
 */

/** The cloud billing month: 730 hours. */
export const HOURS_PER_MONTH = 730;

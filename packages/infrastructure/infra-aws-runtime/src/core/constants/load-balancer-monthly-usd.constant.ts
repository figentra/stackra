/**
 * Stackra file contract:
 * Purpose: `LOAD_BALANCER_MONTHLY_USD`, the monthly estimate of one ALB in front of a public workload, in US dollars.
 * Boundary: data only; `runtimePlan` adds it per public workload. An estimate, not a bill.
 * Runtime: isomorphic
 * Governing contract: ADR 0493 (decision 3, owner answer Q5).
 */

/** One ALB a month, before traffic. */
export const LOAD_BALANCER_MONTHLY_USD = 20;

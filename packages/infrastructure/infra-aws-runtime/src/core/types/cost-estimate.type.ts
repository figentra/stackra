/**
 * Stackra file contract:
 * Purpose: `CostEstimate`, a runtime plan's monthly estimate in US dollars: each priced item, the total, and the cap
 *          it was checked against (none: the plan only warns).
 * Boundary: type only. Usage-priced resources (queues, topics, buckets) are not items.
 * Runtime: isomorphic
 * Governing contract: ADR 0493 (decision 3).
 */

/** A plan's monthly estimate. */
export type CostEstimate = {
  /** Each priced resource or workload, by plan key. */
  readonly items: readonly { readonly key: string; readonly monthlyUsd: number }[];
  /** The sum of the items. */
  readonly monthlyUsd: number;
  /** The environment's cap, when it has one. */
  readonly limit?: number | undefined;
};

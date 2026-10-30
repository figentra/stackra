/**
 * Stackra file contract:
 * Purpose: `CACHE_SIZES`, the ElastiCache node type each `ResourceSize` of a `cache` resource runs on.
 * Boundary: data only; `runtimePlan` reads it. A member-sized dedicated cache keeps sizing by memory (`cacheNodeType`).
 * Runtime: isomorphic
 * Governing contract: ADR 0493 (decision 3), ADR 0296 (decision 1).
 */

/** Cache sizes. */
export const CACHE_SIZES = Object.freeze({
  small: "cache.t4g.micro",
  medium: "cache.t4g.medium",
  large: "cache.r7g.large",
} as const);

/**
 * Stackra file contract:
 * Purpose: `CACHE_NODE_TYPES`, the ElastiCache node types a dedicated cache is sized onto, smallest first, each with
 *          its memory in MB (AWS's GiB figure × 1024, rounded down): burstable Graviton nodes up to 3 GiB, then
 *          memory-optimised r7g nodes, and a monthly estimate per node in US dollars (ADR 0493 decision 3).
 * Boundary: internal; `cacheNodeType` reads it. Data only.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1: the cache size is a member size), ADR 0172 (cost controls), ADR 0493 (decision 3).
 */

/** Node types in ascending memory. */
export const CACHE_NODE_TYPES = [
  { type: "cache.t4g.micro", memoryMb: 512, monthlyUsd: 12 },
  { type: "cache.t4g.small", memoryMb: 1402, monthlyUsd: 24 },
  { type: "cache.t4g.medium", memoryMb: 3164, monthlyUsd: 48 },
  { type: "cache.r7g.large", memoryMb: 13_383, monthlyUsd: 160 },
  { type: "cache.r7g.xlarge", memoryMb: 26_951, monthlyUsd: 320 },
  { type: "cache.r7g.2xlarge", memoryMb: 54_087, monthlyUsd: 640 },
  { type: "cache.r7g.4xlarge", memoryMb: 108_349, monthlyUsd: 1280 },
] as const;

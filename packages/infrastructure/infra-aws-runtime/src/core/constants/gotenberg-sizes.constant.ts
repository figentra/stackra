/**
 * Stackra file contract:
 * Purpose: `GOTENBERG_SIZES`, the Fargate size of a `gotenberg` resource per `ResourceSize`, with its monthly estimate
 *          per task: Chromium needs a gibibyte, so small is half a vCPU and 1 GiB (about $18 a month).
 * Boundary: data only; the estimate is on-demand Fargate at us-east-1 list price, rounded up, for the cost cap.
 * Runtime: isomorphic
 * Governing contract: ADR 0493 (decision 2: sizes are catalogue entries; as amended: the gotenberg resource).
 */

/** Size to Fargate CPU units, memory and the monthly estimate per task. */
export const GOTENBERG_SIZES = Object.freeze({
  small: { cpu: 512, memoryMb: 1024, monthlyUsd: 18 },
  medium: { cpu: 1024, memoryMb: 2048, monthlyUsd: 40 },
  large: { cpu: 2048, memoryMb: 4096, monthlyUsd: 80 },
} as const);

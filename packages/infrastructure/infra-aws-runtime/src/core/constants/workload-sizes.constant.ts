/**
 * Stackra file contract:
 * Purpose: `WORKLOAD_SIZES`, what each `ResourceSize` of a workload task is on Fargate (ARM): vCPU units, memory in MiB
 *          and a monthly estimate per running task in US dollars.
 * Boundary: data only; `runtimePlan` reads it. Estimates are on-demand list prices rounded up, not a bill.
 * Runtime: isomorphic
 * Governing contract: ADR 0493 (decision 3).
 */

/** Workload task sizes. */
export const WORKLOAD_SIZES = Object.freeze({
  small: { cpu: 256, memoryMb: 512, monthlyUsd: 10 },
  medium: { cpu: 1024, memoryMb: 2048, monthlyUsd: 40 },
  large: { cpu: 2048, memoryMb: 4096, monthlyUsd: 80 },
} as const);

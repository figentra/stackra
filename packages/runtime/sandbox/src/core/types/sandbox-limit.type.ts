/**
 * Stackra file contract:
 * Purpose: `SandboxLimit`, the name of the limit a run passed: `time`, `memory` (heap or stack) or `output` (the result
 *          and the logged lines together).
 * Boundary: a type only; the `limit` detail of `SandboxLimitExceededError`.
 * Runtime: isomorphic
 * Governing contract: ADR 0154 (decision 6).
 */

/**
 * Which limit stopped a run.
 *
 * @example
 * if (refused.limit === "time") { ... }
 */
export type SandboxLimit = "time" | "memory" | "output";

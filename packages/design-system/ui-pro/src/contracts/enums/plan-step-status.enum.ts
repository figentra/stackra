/**
 * Stackra file contract:
 * Purpose: where one step of an agent's plan stands in a `PlanView`: waiting, running, done, failed or skipped.
 * Boundary: the values only; a plan runs as an ephemeral workflow (ADR 0245 decision 8), whose step states these show.
 * Runtime: isomorphic
 * Governing contract: ADR 0245 (decision 8: plans).
 */

/** The states of a plan step. */
// shortcut: a frozen tuple, as the @stackra/ui contracts' enums are, until Enum.of reaches the contracts (ADR 0128).
export const PlanStepStatus = Object.freeze([
  "pending",
  "running",
  "done",
  "failed",
  "skipped",
] as const);

/** One plan step state. */
export type PlanStepStatus = (typeof PlanStepStatus)[number];

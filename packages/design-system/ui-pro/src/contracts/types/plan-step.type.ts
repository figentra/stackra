/**
 * Stackra file contract:
 * Purpose: one step of an agent's plan as a `PlanView` draws it: an id, what it does, an optional detail, and its
 *          status.
 * Boundary: types only; each step is an action call with inputs (ADR 0245 decision 8).
 * Runtime: isomorphic
 * Governing contract: ADR 0245 (decision 8).
 */
import type { ReactNode } from "react";

import type { PlanStepStatus } from "#contracts/enums/plan-step-status.enum";

/** One plan step. */
export interface PlanStep {
  /** The step's id, unique in the plan. */
  readonly id: string;
  /** What the step does (`Create a 10% coupon`). */
  readonly title: ReactNode;
  /** More about it: its inputs, its result, or why it failed. */
  readonly detail?: ReactNode | undefined;
  /** Where it stands. */
  readonly status: PlanStepStatus;
}

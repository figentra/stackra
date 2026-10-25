/**
 * Stackra file contract:
 * Purpose: the props of the `PlanView`: an agent's proposed or running plan as an ordered list of steps with their
 *          status, its accessible name, and the actions under it (approve or reject the plan).
 * Boundary: types only. Approving a plan at L2 and above is a human's act through the actions given here.
 * Runtime: isomorphic
 * Governing contract: ADR 0245 (decision 8); ADR 0310 (decision 3).
 */
import type { ReactNode } from "react";

import type { PlanStep } from "#contracts/types/plan-step.type";

/** Props of the `PlanView`. */
export interface PlanViewContractProps {
  /** The plan's name for screen readers (`Plan to restock low items`). */
  readonly label: string;
  /** The steps, in order. */
  readonly steps: readonly PlanStep[];
  /** What the viewer can do with the plan. */
  readonly actions?: ReactNode | undefined;
}

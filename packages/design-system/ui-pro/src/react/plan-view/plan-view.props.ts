/**
 * Stackra file contract:
 * Purpose: `PlanViewProps`, props of the web PlanView: the contract plus the word read for each status.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0245 (decision 8); ADR 0310 (decision 3); WCAG 2.2 SC 1.4.1.
 */
import type { PlanStepStatus } from "#contracts/enums/plan-step-status.enum";
import type { PlanViewContractProps } from "#contracts/types/plan-view-contract-props.type";

/** Props of the web PlanView: the contract plus the word read for each status. */
export type PlanViewProps = PlanViewContractProps & {
  /** The words read for each status; `ui_pro::enums.plan_step_status.*` in the active locale when left out. */
  readonly statusLabels?: Readonly<Record<PlanStepStatus, string>> | undefined;
};

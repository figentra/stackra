/**
 * Stackra file contract:
 * Purpose: the web `PlanView`: an agent's plan as a HeroUI Pro Timeline through this package's wrapper, one item per
 *          step, its marker tinted by the step's status, with the actions on the plan under it.
 * Boundary: shows only; approving or rejecting the plan is the caller's actions. The list is named by `label`, and
 *           each step's status is read out with it, not by colour alone.
 * Runtime: browser
 * Governing contract: ADR 0245 (decision 8); ADR 0310 (decision 3); WCAG 2.2 SC 1.4.1.
 */
import type { ReactElement } from "react";

import type { PlanStepStatus } from "#contracts/enums/plan-step-status.enum";
import type { PlanViewContractProps } from "#contracts/types/plan-view-contract-props.type";
import { Timeline } from "#react/timeline/timeline";

/** Props of the web PlanView: the contract plus the word read for each status. */
export type PlanViewProps = PlanViewContractProps & {
  /** The words read for each status, in the app's language (`Done`, `Running`). */
  readonly statusLabels: Readonly<Record<PlanStepStatus, string>>;
};

/** The Timeline marker tone of each step status. */
const TONE = Object.freeze({
  pending: "muted",
  running: "current",
  done: "success",
  failed: "danger",
  skipped: "default",
} as const);

/** An agent's plan, step by step. */
export function PlanView({ label, steps, actions, statusLabels }: PlanViewProps): ReactElement {
  return (
    <div data-slot="plan-view" className="flex flex-col gap-3">
      <Timeline aria-label={label} size="sm">
        {steps.map((step) => (
          <Timeline.Item key={step.id} status={TONE[step.status]} data-step-status={step.status}>
            <Timeline.Marker />
            <Timeline.Connector />
            <Timeline.Content>
              <p className="text-sm font-medium">
                {step.title}
                <span className="sr-only">{` (${statusLabels[step.status]})`}</span>
              </p>
              {step.detail == null ? null : <p className="text-sm text-muted">{step.detail}</p>}
            </Timeline.Content>
          </Timeline.Item>
        ))}
      </Timeline>
      {actions == null ? null : <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

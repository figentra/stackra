/**
 * Stackra file contract:
 * Purpose: the native `PlanView`: an agent's plan as HeroUI Native Pro's Timeline through this package's wrapper, one
 *          item per step, its marker tinted by the step's status and the status written under the title, with the
 *          actions on the plan under it.
 * Boundary: shows only; approving or rejecting the plan is the caller's actions. The list is a `list` named by `label`,
 *           and each step's status is a word (`statusLabels`, or `ui_pro::enums.plan_step_status.*`), not colour alone.
 *           Each item is one accessible element that reads the title, then the status, when the title is text.
 * Runtime: react-native
 * Governing contract: ADR 0245 (decision 8); ADR 0310 (decision 3); WCAG 2.2 SC 1.4.1.
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import type { PlanStepStatus } from "#contracts/enums/plan-step-status.enum";

import { UI_PRO_KEYS } from "#core/constants/ui-pro-keys.constant";
import { useUiProText } from "#native/hooks/use-ui-pro-text";
import { Timeline } from "#native/timeline/timeline";
import type { PlanViewProps } from "#native/plan-view/plan-view.props";

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
  const t = useUiProText();
  const statusOf = (status: PlanStepStatus): string =>
    statusLabels?.[status] ?? t(UI_PRO_KEYS.ui_pro.enums.plan_step_status[status]);
  return (
    <View testID="plan-view" className="gap-3">
      <Timeline size="sm" accessibilityRole="list" accessibilityLabel={label}>
        {steps.map((step) => (
          <Timeline.Item
            key={step.id}
            status={TONE[step.status]}
            testID={`plan-step-${step.id}`}
            {...(typeof step.title === "string"
              ? { accessible: true, accessibilityLabel: `${step.title}, ${statusOf(step.status)}` }
              : {})}
          >
            <Timeline.Rail>
              <Timeline.Marker />
              <Timeline.Connector />
            </Timeline.Rail>
            <Timeline.Content>
              <Timeline.Title>{step.title}</Timeline.Title>
              <Timeline.Description>{statusOf(step.status)}</Timeline.Description>
              {step.detail == null ? null : (
                <Timeline.Description>{step.detail}</Timeline.Description>
              )}
            </Timeline.Content>
          </Timeline.Item>
        ))}
      </Timeline>
      {actions == null ? null : <View className="flex-row flex-wrap gap-2">{actions}</View>}
    </View>
  );
}

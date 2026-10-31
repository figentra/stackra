/**
 * Stackra file contract:
 * Purpose: the web `Stepper`: the steps of a multi-step task in order, each a marker (its number in the customer's
 *          digits or its icon, a check once complete) with its name, an optional line and "Optional", joined by
 *          connectors that fill as steps complete; horizontal or vertical. `compact` is "Step 2 of 4", the current
 *          step's name and a dot per step. With `onStepPress`, complete steps (any step but the current one when not
 *          linear) are buttons.
 * Boundary: an ordered list named by `label`; the current step carries `aria-current="step"`, complete and failing
 *           steps say so to assistive tech. Pressable steps are native buttons (Tab, Enter, Space). Logical properties
 *           only, so the row and the connectors mirror in right-to-left; the connectors' fill animates only at full
 *           motion.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); ADR 0329 (motion); WCAG 2.2 SC 1.3.1, 2.1.1
 *          and 4.1.2; STA-1371 (owner request 2026-10-29).
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import type { StepperStepStatus } from "#contracts/types/stepper-step-status.type";
import { DISPLAY_KEYS } from "#core/constants/display-keys.constant";
import { stepperStatesOf } from "#core/functions/stepper-states-of.function";
import { useMotion } from "#react/design-system-provider/use-motion";
import { useNumberFormat } from "#react/hooks/use-number-format";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";
import { SlotIcon } from "#react/slot-icon/slot-icon";
import type { StepperProps } from "#react/stepper/stepper.props";

/** The stepper's keys. */
const K = DISPLAY_KEYS.ui.stepper;

/** The marker's classes per status. */
const MARKER = {
  complete: "bg-accent text-accent-foreground",
  current: "border-2 border-accent bg-background text-accent",
  upcoming: "border border-separator bg-background text-muted",
  optional: "border border-dashed border-separator bg-background text-muted",
  error: "bg-danger text-danger-foreground",
} as const satisfies Record<StepperStepStatus, string>;

/** The compact variant's dot classes per status. */
const DOT = {
  complete: "w-2 bg-accent",
  current: "w-5 bg-accent",
  upcoming: "w-2 bg-separator",
  optional: "w-2 bg-separator",
  error: "w-2 bg-danger",
} as const satisfies Record<StepperStepStatus, string>;

/** The steps of a multi-step task. */
export function Stepper({
  steps,
  currentStep,
  orientation = "horizontal",
  variant = "default",
  marker = "number",
  onStepPress,
  isLinear = true,
  label,
  className,
}: StepperProps): ReactElement {
  const t = useUiText();
  const format = useNumberFormat();
  const motion = useMotion();
  const states = stepperStatesOf(steps, currentStep, onStepPress !== undefined, isLinear);
  const name = label ?? t(K.label);
  const fill = motion === "full" ? "transition-colors duration-(--duration-slow)" : "";

  if (variant === "compact") {
    const at = Math.max(
      0,
      states.findIndex((state) => state.status === "current"),
    );
    return (
      <div
        role="group"
        aria-label={name}
        data-slot="stepper"
        className={cn("grid gap-1", className)}
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="min-w-0 truncate text-sm font-medium">{states[at]?.step.label}</span>
          <span className="shrink-0 text-xs text-muted tabular-nums">
            {t(K.step_of, { step: format(at + 1), total: format(states.length) })}
          </span>
        </div>
        <span aria-hidden className="flex gap-1.5">
          {states.map(({ step, status }) => (
            <span
              key={step.id}
              className={cn("h-2 rounded-[var(--radius-pill)]", fill, DOT[status])}
            />
          ))}
        </span>
      </div>
    );
  }

  const isVertical = orientation === "vertical";
  return (
    <ol
      aria-label={name}
      data-slot="stepper"
      data-orientation={orientation}
      className={cn("m-0 list-none p-0", isVertical ? "grid" : "flex items-start", className)}
    >
      {states.map(({ step, status, isPressable }, index) => {
        const isLast = index === states.length - 1;
        const said =
          status === "complete" ? t(K.complete) : status === "error" ? t(K.error) : undefined;
        const content = (
          <>
            <span
              aria-hidden
              className={cn(
                "relative z-(--z-raised) flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-pill)] text-sm font-medium tabular-nums [&_svg]:size-4",
                fill,
                MARKER[status],
              )}
            >
              {status === "complete" ? (
                <Icon name="check" />
              ) : marker === "icon" && step.icon ? (
                <SlotIcon icon={step.icon} />
              ) : (
                format(index + 1)
              )}
            </span>
            <span
              className={cn(
                "grid min-w-0 gap-0.5",
                isVertical ? "pt-1.5 text-start" : "text-center",
              )}
            >
              <span
                className={cn(
                  "text-sm",
                  status === "current" ? "font-medium text-foreground" : "text-muted",
                  status === "error" && "text-danger",
                )}
              >
                {step.label}
                {said ? <span className="sr-only">{`, ${said}`}</span> : null}
              </span>
              {step.description ? (
                <span className="text-xs text-muted">{step.description}</span>
              ) : null}
              {status === "optional" ? (
                <span className="text-xs text-muted italic">{t(K.optional)}</span>
              ) : null}
            </span>
          </>
        );
        const box = cn(
          "flex rounded-[var(--radius-control)] outline-none",
          isVertical ? "items-start gap-3" : "flex-col items-center gap-2 px-1",
        );
        return (
          <li
            key={step.id}
            aria-current={status === "current" ? "step" : undefined}
            className={cn("relative min-w-0", isVertical ? (isLast ? "" : "pb-6") : "flex-1")}
          >
            {isLast ? null : (
              <span
                aria-hidden
                className={cn(
                  "absolute",
                  fill,
                  status === "complete" ? "bg-accent" : "bg-separator",
                  isVertical
                    ? "start-4 top-9 bottom-1 w-px"
                    : "start-[calc(50%+1.25rem)] end-[calc(-50%+1.25rem)] top-4 h-px",
                )}
              />
            )}
            {isPressable ? (
              <button
                type="button"
                onClick={() => onStepPress?.(step.id)}
                className={cn(
                  box,
                  "w-full cursor-pointer hover:[&>span:first-child]:opacity-85 focus-visible:ring-2 focus-visible:ring-focus",
                )}
              >
                {content}
              </button>
            ) : (
              <div className={box}>{content}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

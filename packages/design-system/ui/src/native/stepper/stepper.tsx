/**
 * Stackra file contract:
 * Purpose: the native `Stepper`: the steps of a multi-step task in order, each a marker (its number in the customer's
 *          digits or its icon, a check once complete) with its name, an optional line and "Optional", joined by
 *          connectors; horizontal or vertical. `compact` is "Step 2 of 4", the current step's name and a dot per step.
 *          With `onStepPress`, complete steps (any step but the current one when not linear) are buttons.
 * Boundary: a list for VoiceOver and TalkBack; each step is read as one element with its status, the current one
 *           selected. Rows use start/end, so they mirror in right-to-left. Nothing animates, so every motion level
 *           reads the same.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1 and 4.1.2; STA-1371
 *          (owner request 2026-10-29).
 */
import type { ReactElement } from "react";
import { Pressable, View } from "react-native";

import type { StepperStepStatus } from "#contracts/types/stepper-step-status.type";
import { DISPLAY_KEYS } from "#core/constants/display-keys.constant";
import { stepperStatesOf } from "#core/functions/stepper-states-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { useNumberFormat } from "#native/hooks/use-number-format";
import { Icon } from "#native/icon/icon";
import { SlotIcon } from "#native/slot-icon/slot-icon";
import type { StepperProps } from "#native/stepper/stepper.props";
import { Text } from "#native/text/text";

/** The stepper's keys. */
const K = DISPLAY_KEYS.ui.stepper;

/** The marker's classes per status. */
const MARKER = {
  complete: "bg-accent-soft",
  current: "border-2 border-accent bg-background",
  upcoming: "border border-separator bg-background",
  optional: "border border-dashed border-separator bg-background",
  error: "bg-danger",
} as const satisfies Record<StepperStepStatus, string>;

/** The marker's number classes per status. */
const DIGIT = {
  complete: "text-accent-soft-foreground",
  current: "text-accent",
  upcoming: "text-muted",
  optional: "text-muted",
  error: "text-danger-foreground",
} as const satisfies Record<StepperStepStatus, string>;

/** The compact variant's dot classes per status. */
const DOT = {
  complete: "w-2 bg-accent",
  current: "w-5 bg-accent",
  upcoming: "w-2 bg-separator",
  optional: "w-2 bg-separator",
  error: "w-2 bg-danger",
} as const satisfies Record<StepperStepStatus, string>;

/** Horizontal: a half connector each side of a disc, so neighbours' halves meet between them. */
function half(isOn: boolean, isShown: boolean): ReactElement {
  return <View className={`h-px flex-1 ${isShown ? (isOn ? "bg-accent" : "bg-separator") : ""}`} />;
}

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
  const states = stepperStatesOf(steps, currentStep, onStepPress !== undefined, isLinear);
  const name = label ?? t(K.label);

  if (variant === "compact") {
    const at = Math.max(
      0,
      states.findIndex((state) => state.status === "current"),
    );
    const position = t(K.step_of, { step: format(at + 1), total: format(states.length) });
    return (
      <View
        accessible
        accessibilityLabel={`${name}, ${position}, ${states[at]?.step.label ?? ""}`}
        className={`gap-1 ${className ?? ""}`}
      >
        <View className="flex-row items-baseline justify-between gap-3">
          <Text className="flex-1 font-medium" numberOfLines={1}>
            {states[at]?.step.label}
          </Text>
          <Text type="small" tone="muted">
            {position}
          </Text>
        </View>
        <View className="flex-row gap-1.5">
          {states.map(({ step, status }) => (
            <View key={step.id} className={`h-2 rounded-[var(--radius-pill)] ${DOT[status]}`} />
          ))}
        </View>
      </View>
    );
  }

  const isVertical = orientation === "vertical";
  return (
    <View
      accessibilityRole="list"
      accessibilityLabel={name}
      className={`${isVertical ? "" : "flex-row items-start"} ${className ?? ""}`}
    >
      {states.map(({ step, status, isPressable }, index) => {
        const isLast = index === states.length - 1;
        const said =
          status === "complete"
            ? t(K.complete)
            : status === "error"
              ? t(K.error)
              : status === "optional"
                ? t(K.optional)
                : undefined;
        const disc = (
          <View
            className={`size-8 items-center justify-center rounded-[var(--radius-pill)] ${MARKER[status]}`}
          >
            {status === "complete" ? (
              <Icon name="check" size="sm" tone="accent" />
            ) : marker === "icon" && step.icon ? (
              <SlotIcon icon={step.icon} />
            ) : (
              <Text type="small" className={`font-medium ${DIGIT[status]}`}>
                {format(index + 1)}
              </Text>
            )}
          </View>
        );
        const before = states[index - 1];
        const line = isLast ? null : (
          <View
            className={`my-1 w-px flex-1 ${status === "complete" ? "bg-accent" : "bg-separator"}`}
          />
        );
        const text = (
          <View className={`gap-0.5 ${isVertical ? "flex-1 pt-1.5" : "items-center px-1"}`}>
            <Text
              type="small"
              className={`${status === "current" ? "font-medium" : ""} ${isVertical ? "" : "text-center"}`}
              tone={status === "error" ? "danger" : status === "current" ? undefined : "muted"}
            >
              {step.label}
            </Text>
            {step.description ? (
              <Text type="small" tone="muted" className={isVertical ? "" : "text-center"}>
                {step.description}
              </Text>
            ) : null}
            {status === "optional" ? (
              <Text type="small" tone="muted" className="italic">
                {t(K.optional)}
              </Text>
            ) : null}
          </View>
        );
        const a11y = {
          accessibilityLabel: said ? `${step.label}, ${said}` : step.label,
          accessibilityState: { selected: status === "current" },
        };
        const body = isVertical ? (
          <View className="flex-row gap-3">
            <View className="items-center">
              {disc}
              {line}
            </View>
            <View className={`flex-1 ${isLast ? "" : "pb-6"}`}>{text}</View>
          </View>
        ) : (
          <View className="gap-2">
            <View className="flex-row items-center">
              {half(before?.status === "complete", index > 0)}
              {disc}
              {half(status === "complete", !isLast)}
            </View>
            {text}
          </View>
        );
        return (
          <View key={step.id} className={isVertical ? "" : "flex-1"}>
            {isPressable ? (
              <Pressable
                accessibilityRole="button"
                {...a11y}
                onPress={() => onStepPress?.(step.id)}
              >
                {body}
              </Pressable>
            ) : (
              <View accessible {...a11y}>
                {body}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

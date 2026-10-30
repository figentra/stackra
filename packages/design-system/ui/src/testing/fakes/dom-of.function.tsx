/**
 * Stackra file contract:
 * Purpose: `domOf(tag)`, a DOM stand-in component for a native one: `accessibilityLabel` becomes `aria-label`,
 *          `accessibilityRole` `role`, `accessibilityState` and `accessibilityValue` the `aria-*` states,
 *          `accessibilityLiveRegion` `aria-live` and `onPress` a click; an `input` maps `onChangeText`.
 * Boundary: test-only; the native-dom stand-ins are built from it.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); ADR 0305 (one declaration per file); STA-1371.
 */
import { createElement, type ComponentType, type ReactNode } from "react";

/** A DOM element that speaks the native accessibility props. */
export const domOf = (tag: string): ComponentType<Record<string, unknown>> =>
  function DomStandIn({
    children,
    accessibilityLabel,
    accessibilityRole,
    accessibilityState,
    accessibilityValue,
    accessibilityLiveRegion,
    onPress,
    testID,
    disabled,
    value,
    onChangeText,
  }: Record<string, unknown>) {
    return createElement(
      tag,
      {
        "aria-label": accessibilityLabel,
        role: accessibilityRole,
        "aria-selected": (accessibilityState as { selected?: boolean } | undefined)?.selected,
        "aria-checked": (accessibilityState as { checked?: boolean } | undefined)?.checked,
        "aria-disabled": (accessibilityState as { disabled?: boolean } | undefined)?.disabled,
        "aria-valuenow": (accessibilityValue as { now?: number } | undefined)?.now,
        "aria-valuetext": (accessibilityValue as { text?: string } | undefined)?.text,
        "aria-live": accessibilityLiveRegion,
        "data-testid": testID,
        disabled,
        ...(tag === "input"
          ? {
              value: value ?? "",
              onChange: (event: { target: { value: string } }) =>
                (onChangeText as ((text: string) => void) | undefined)?.(event.target.value),
            }
          : {}),
        onClick: onPress,
      },
      tag === "input" ? undefined : (children as ReactNode),
    );
  };

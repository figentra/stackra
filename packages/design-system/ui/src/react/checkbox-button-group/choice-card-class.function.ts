/**
 * Stackra file contract:
 * Purpose: `choiceCardClass(state)`, the class of one card of the web RadioButtonGroup and CheckboxButtonGroup in a state.
 * Boundary: pure; tokens only, reduced motion drops the colour transition.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0305 (rules 10 to 13).
 */
import { cn } from "@heroui/react";

/** The card class for a state. */
export const choiceCardClass = ({
  isSelected,
  isFocusVisible,
  isDisabled,
}: {
  readonly isSelected: boolean;
  readonly isFocusVisible: boolean;
  readonly isDisabled: boolean;
}): string =>
  cn(
    "flex min-w-48 flex-1 cursor-pointer items-start gap-3 rounded-[var(--radius-container)] border bg-surface p-4 text-start transition-colors outline-none motion-reduce:transition-none",
    isSelected ? "border-accent bg-accent-soft" : "border-border hover:border-field-border-hover",
    isFocusVisible && "outline-2 outline-offset-2 outline-focus",
    isDisabled && "cursor-not-allowed opacity-(--disabled-opacity)",
  ) ?? "";

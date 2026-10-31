/**
 * Stackra file contract:
 * Purpose: the web `ReactionButton`: a pill with an emoji and its count that the user toggles; when on it takes the
 *          accent tint. The count is written in the customer's digits.
 * Boundary: React Aria's ToggleButton (`aria-pressed`), named "<emoji name>, <count>" from the `ui` catalogue. The
 *           count is the caller's: it adds or removes the user's own reaction on `onChange`.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); WCAG 2.2 SC 2.5.8,
 *          4.1.2.
 */
import { cn } from "@heroui/react";
import { withDigits } from "@stackra/i18n";
import { useNumerals } from "@stackra/i18n/react";
import { useState, type ReactElement } from "react";
import { ToggleButton, useLocale } from "react-aria-components";

import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import type { ReactionButtonProps } from "#react/reaction-button/reaction-button.props";

/** An emoji reaction with its count. */
export function ReactionButton({
  emoji,
  count,
  isSelected: controlledSelected,
  defaultSelected = false,
  onChange,
  label,
  isDisabled,
  className,
}: ReactionButtonProps): ReactElement {
  const t = useUiText();
  const { locale } = useLocale();
  const numerals = useNumerals();
  const [ownSelected, setOwnSelected] = useState(defaultSelected);
  const isSelected = controlledSelected ?? ownSelected;
  // Uncontrolled: `count` holds the user's 1 when `defaultSelected`, so the shown count follows the toggle.
  const shown =
    controlledSelected === undefined
      ? count - (defaultSelected ? 1 : 0) + (ownSelected ? 1 : 0)
      : count;
  const toggle = (next: boolean): void => {
    setOwnSelected(next);
    onChange?.(next);
  };
  const number = withDigits(
    new Intl.NumberFormat(locale, { notation: "compact" }).format(shown),
    numerals,
  );
  return (
    <ToggleButton
      isSelected={isSelected}
      onChange={toggle}
      isDisabled={isDisabled ?? false}
      aria-label={t(FORMS_KEYS.ui.reaction_button.label, { emoji: label ?? emoji, count: number })}
      className={({ isFocusVisible }) =>
        cn(
          "inline-flex min-h-8 items-center gap-1.5 rounded-[var(--radius-pill)] border px-2.5 text-sm transition-colors outline-none motion-reduce:transition-none disabled:opacity-(--disabled-opacity)",
          isSelected
            ? "border-accent bg-accent-soft text-accent-soft-foreground"
            : "border-border bg-surface hover:bg-default",
          isFocusVisible && "outline-2 outline-offset-2 outline-focus",
          className,
        ) ?? ""
      }
    >
      {/* Drawn from an attribute, not text: the name says what it is, and axe cannot match a glyph against a name. */}
      <span aria-hidden data-glyph={emoji} className="before:content-[attr(data-glyph)]" />
      <span aria-hidden className="tabular-nums">
        {number}
      </span>
    </ToggleButton>
  );
}

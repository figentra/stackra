/**
 * Stackra file contract:
 * Purpose: one choice of a playground switcher (the scheme, the locale): a HeroUI ToggleButton whose
 *          selected state is the accent fill and a check mark, so selection does not rest on the fill alone.
 * Boundary: the button only; its group (`ToggleButtonGroup`) and what a choice means are the caller's.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); WCAG 2.2 SC 1.4.1 and 1.4.11.
 */
import { ToggleButton } from "@stackra/ui/react";
import type { ChoiceProps } from "./choice.props";

// HeroUI marks the selected toggle with `accent-soft` on a `default` track, about 1:1 in this theme (an open brand
// question), so the switcher paints the selected one with the accent fill instead: well over 3:1 in both schemes.
const SELECTED_AS_ACCENT =
  "[--toggle-button-bg-selected:var(--accent)] [--toggle-button-bg-selected-hover:var(--accent-hover)] [--toggle-button-bg-selected-pressed:var(--accent-pressed)] [--toggle-button-fg-selected:var(--accent-foreground)]";

/** A switcher button: a check mark marks the selected one. */
export function Choice({ id, "aria-label": label, children }: ChoiceProps) {
  return (
    <ToggleButton
      id={id}
      className={SELECTED_AS_ACCENT}
      {...(label ? { "aria-label": label } : {})}
    >
      {({ isSelected }) => (
        <>
          {isSelected ? (
            <svg viewBox="0 0 16 16" aria-hidden="true" data-testid="selected-mark">
              <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          ) : null}
          {children}
        </>
      )}
    </ToggleButton>
  );
}

/**
 * Stackra file contract:
 * Purpose: `ShortcutHintProps`, what `ShortcutHint` takes: the binding to draw, whether it is a badge over an action,
 *          and whether screen readers skip it (inside a control that already carries `aria-keyshortcuts`).
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0508 (hints are HeroUI's Kbd).
 */

/** The props of the key hint. */
export interface ShortcutHintProps {
  /** The binding (`mod+k`, `g s`); nothing is drawn when it does not parse. */
  readonly keys: string;
  /** True: drawn as a small badge centred above the action (the hold-Mod reveal). */
  readonly isBadge?: boolean | undefined;
  /** True: hidden from screen readers; otherwise read as its spoken form ("Command K"). */
  readonly isDecorative?: boolean | undefined;
  /** Extra classes on the Kbd. */
  readonly className?: string | undefined;
}

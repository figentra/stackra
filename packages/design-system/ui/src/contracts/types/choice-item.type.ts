/**
 * Stackra file contract:
 * Purpose: `ChoiceItem`, one card of a RadioButtonGroup or CheckboxButtonGroup: its key, title, an optional line under
 *          it, an optional icon and whether it is refused.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0305.
 */
import type { IconName } from "@stackra/icons/contracts";

/** One card choice. */
export interface ChoiceItem {
  /** The key the group's value holds when this card is picked; unique within the group. */
  readonly id: string;
  /** The card's title, its accessible name. */
  readonly label: string;
  /** A second, muted line, read as the card's description. */
  readonly description?: string | undefined;
  /** A leading icon from the house set. */
  readonly icon?: IconName | undefined;
  /** True to show the card but refuse it. */
  readonly isDisabled?: boolean | undefined;
}

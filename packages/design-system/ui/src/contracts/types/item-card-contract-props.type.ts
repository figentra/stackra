/**
 * Stackra file contract:
 * Purpose: the props every runtime's `ItemCard` takes: one row-like card with an icon, a title, a line under it and
 *          an end slot (a value, a chip, a chevron), pressable when given `onPress`.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3).
 */
import type { IconName } from "@stackra/icons/contracts";
import type { ReactNode } from "react";

/** Props shared by the web and native `ItemCard`. */
export interface ItemCardContractProps {
  /** The title, the card's accessible name. */
  readonly title: string;
  /** A second, muted line. */
  readonly description?: string | undefined;
  /** A leading icon from the house set. */
  readonly icon?: IconName | undefined;
  /** What sits at the inline end, for example a value or a Chip. */
  readonly end?: ReactNode;
  /** Called when the card is pressed; without it the card is not a button. A pressable card shows a chevron. */
  readonly onPress?: (() => void) | undefined;
  /** True to refuse presses and show the disabled style. */
  readonly isDisabled?: boolean | undefined;
}

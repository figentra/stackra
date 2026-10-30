/**
 * Stackra file contract:
 * Purpose: `WheelPickerItem`, one choice on a wheel column: its key, its text and whether it is refused.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0305.
 */

/** One choice on a wheel. */
export interface WheelPickerItem {
  /** The key the column's value holds when this choice is centred; unique within the column. */
  readonly id: string;
  /** The text shown on the wheel and read out. */
  readonly label: string;
  /** True to show the choice but skip it. */
  readonly isDisabled?: boolean | undefined;
}

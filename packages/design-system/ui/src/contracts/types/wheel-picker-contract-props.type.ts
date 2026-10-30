/**
 * Stackra file contract:
 * Purpose: the props every runtime's `WheelPicker` takes: side-by-side wheels, each centring one choice, with the
 *          chosen key of each column as the value.
 * Boundary: types only. Each wheel is a list box (web) or an adjustable control (native), so it is read and moved
 *           with the keyboard or a screen reader as well as by scrolling.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0303.
 */
import type { WheelPickerColumn } from "#contracts/types/wheel-picker-column.type";

/** Props shared by the web and native `WheelPicker`. */
export interface WheelPickerContractProps {
  /** The wheels, from the reading start. */
  readonly columns: readonly WheelPickerColumn[];
  /** The centred key of each column, by column key, for a controlled picker. */
  readonly value?: Readonly<Record<string, string>> | undefined;
  /** The starting keys, for an uncontrolled picker; a column without one starts on its first choice. */
  readonly defaultValue?: Readonly<Record<string, string>> | undefined;
  /** Called with every column's key each time a wheel settles on a new choice. */
  readonly onChange?: ((value: Readonly<Record<string, string>>) => void) | undefined;
  /** How many rows show at once, odd; defaults to 5. */
  readonly visibleCount?: number | undefined;
  /** The spoken name of the whole picker. */
  readonly label?: string | undefined;
  /** True to refuse every change. */
  readonly isDisabled?: boolean | undefined;
}

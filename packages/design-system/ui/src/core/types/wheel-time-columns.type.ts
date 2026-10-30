/**
 * Stackra file contract:
 * Purpose: `WheelTimeColumns`, the wheels of a WheelTimePicker and the time as their keys.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0305 (rules 10 to 13).
 */
import type { WheelPickerColumn } from "#contracts/types/wheel-picker-column.type";

/** The wheels of a time and the value as their keys. */
export interface WheelTimeColumns {
  /** The hour, minute and period wheels, in order. */
  readonly columns: readonly WheelPickerColumn[];
  /** The chosen item key of each wheel, by wheel key. */
  readonly value: Readonly<Record<string, string>>;
}

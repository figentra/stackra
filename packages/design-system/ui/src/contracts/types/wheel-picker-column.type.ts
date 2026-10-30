/**
 * Stackra file contract:
 * Purpose: `WheelPickerColumn`, one wheel of a WheelPicker: its key, its spoken name and its choices.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0305.
 */
import type { WheelPickerItem } from "#contracts/types/wheel-picker-item.type";

/** One wheel. */
export interface WheelPickerColumn {
  /** The column's key, unique within the picker. */
  readonly id: string;
  /** The column's spoken name, for example "Hour". */
  readonly label: string;
  /** The choices, top to bottom. */
  readonly items: readonly WheelPickerItem[];
}

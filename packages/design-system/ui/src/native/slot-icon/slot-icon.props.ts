/**
 * Stackra file contract:
 * Purpose: `SlotIconProps`, the props of the native `SlotIcon` in `slot-icon.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0303 (decisions 7 and 10).
 */
import type { IconSlot } from "#contracts/types/icon-slot.type";

/** Props of SlotIcon. */
export interface SlotIconProps {
  /** The slot's value: an icon name or an element; nothing draws nothing. */
  readonly icon?: IconSlot | undefined;
}

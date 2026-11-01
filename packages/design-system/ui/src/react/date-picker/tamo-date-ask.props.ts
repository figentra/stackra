/**
 * Stackra file contract:
 * Purpose: `TamoDateAskProps`, the props of the internal `TamoDateAsk` in `tamo-date-ask.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0507.
 */
import type { CalendarDate } from "@internationalized/date";

import type { TamoSlot } from "#contracts/types/tamo-slot.type";

/** Props of the natural-language date box. */
export interface TamoDateAskProps {
  /** The slot `useTamo` returned for the date box. */
  readonly slot: TamoSlot;
  /** True for a range ("last month"). */
  readonly isRange: boolean;
  /** The day words count from. */
  readonly today: CalendarDate;
  /** Called with the day, or the range's ends, once applied. */
  readonly onPick: (start: CalendarDate, end: CalendarDate | undefined) => void;
}

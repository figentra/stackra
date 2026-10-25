/**
 * Stackra file contract:
 * Purpose: `WidgetSlotProps`, what the native `WidgetSlot` takes: the slot, how many tiles share a row, the range and the
 *          actor facts the widgets' binds read.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12); ADR 0307 (rules 14 and 18).
 */
import type { TimeRange } from "#core/enums/time-range.enum";
import type { SlotRef } from "#core/types/slot-ref.type";

/** The props of a native widget slot. */
export interface WidgetSlotProps {
  /** The slot to render (`Slots.Dashboard.Header`). */
  readonly slot: SlotRef;

  /** How many tiles share a row; 1 by default. */
  readonly columns?: number;

  /** The range every tile that takes one shows; each tile's own default when absent. */
  readonly range?: TimeRange;

  /** The signed-in actor's facts the widgets' `actor.*` binds read. */
  readonly actor?: Readonly<Record<string, unknown>>;
}

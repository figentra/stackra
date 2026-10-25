/**
 * Stackra file contract:
 * Purpose: `WidgetCardProps`, what the native `WidgetCard` takes: the widget, the range and the actor facts.
 * Boundary: a type only, internal to the `./native` entry.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12); ADR 0307 (rule 14).
 */
import type { TimeRange } from "#core/enums/time-range.enum";
import type { WidgetDescriptor } from "#core/types/widget-descriptor.type";

/** The props of one native tile. */
export interface WidgetCardProps {
  /** The widget to draw. */
  readonly widget: WidgetDescriptor;

  /** The range to show; the widget's own default when absent. */
  readonly range?: TimeRange;

  /** The signed-in actor's facts its binds read. */
  readonly actor?: Readonly<Record<string, unknown>>;
}

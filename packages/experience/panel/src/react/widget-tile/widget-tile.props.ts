/**
 * Stackra file contract:
 * Purpose: `WidgetTileProps`, what `WidgetTile` takes: the widget, the dashboard's range when a picker above drives it, and
 *          the actor facts its binds read.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12); ADR 0307 (rules 14 and 20).
 */
import type { TimeRange } from "#core/enums/time-range.enum";
import type { WidgetDescriptor } from "#core/types/widget-descriptor.type";

/** The props of one tile. */
export interface WidgetTileProps {
  /** The widget to draw. */
  readonly widget: WidgetDescriptor;

  /** The range a dashboard's picker selected; the tile shows its own picker when absent. */
  readonly range?: TimeRange;

  /** The signed-in actor's facts its `actor.*` binds read (`{ accountId }`). */
  readonly actor?: Readonly<Record<string, unknown>>;
}

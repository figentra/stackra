/**
 * Stackra file contract:
 * Purpose: `WidgetBodyProps`, what `WidgetBody` takes: the widget, its query's answer and the refresh state.
 * Boundary: a type only, internal to the `./react` entry.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12); ADR 0307 (rule 14).
 */
import type { WidgetDescriptor } from "#core/types/widget-descriptor.type";

/** The props of a widget's body. */
export interface WidgetBodyProps {
  /** The widget whose display is drawn. */
  readonly widget: WidgetDescriptor;

  /** Its query's answer. */
  readonly data: unknown;

  /** True while the tile refetches. */
  readonly isRefreshing: boolean;
}

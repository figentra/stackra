/**
 * Stackra file contract:
 * Purpose: `WidgetContentProps`, what the native `WidgetContent` takes: the widget, its query's answer and the refresh
 *          state.
 * Boundary: a type only, internal to the `./native` entry.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12); ADR 0307 (rule 14).
 */
import type { WidgetDescriptor } from "#core/types/widget-descriptor.type";

/** The props of a native widget's content. */
export interface WidgetContentProps {
  /** The widget whose display is drawn. */
  readonly widget: WidgetDescriptor;

  /** Its query's answer. */
  readonly data: unknown;

  /** True while the card refetches. */
  readonly isRefreshing: boolean;
}

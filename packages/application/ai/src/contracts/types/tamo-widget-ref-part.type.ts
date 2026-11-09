/**
 * Stackra file contract:
 * Purpose: `TamoWidgetRefPart`, the data of a `data-tamo-widget_ref` part: a module's widget by key, with
 *          the filters it opens with.
 * Boundary: a type only; the data of one AI SDK data part, drawn by the host's renderer, never markup from the
 *           model.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system); ADR 0504 (module UI kits).
 */
/** A placed widget in a chat turn. */
export interface TamoWidgetRefPart {
  /** The widget's key. */
  readonly widgetKey: string;

  /** The filters the widget opens with, keyed by field. */
  readonly filters?: Readonly<Record<string, unknown>> | undefined;
}

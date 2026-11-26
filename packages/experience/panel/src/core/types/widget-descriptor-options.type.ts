/**
 * Stackra file contract:
 * Purpose: `WidgetDescriptorOptions`, the second argument of `widget(Widget, options)` in a generated widget table: the
 *          placement, the permission and roles, and the renderer of a Custom display.
 * Boundary: a type only, derived from `WidgetDescriptor`: every field optional, except the class (the first argument)
 *           and the refresh period, given as text. Values the widget class already carries (its key, query, display and
 *           size, as a generated widget ref's statics) are read from it unless given here.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 14 and 17 to 19); ADR 0306 (layers); ADR 0336 (decision 4: layer 2b).
 */
import type { WidgetDescriptor } from "#core/types/widget-descriptor.type";

/** How a widget is placed and gated: any `WidgetDescriptor` field, and the refresh period as text. */
export type WidgetDescriptorOptions = Partial<
  Omit<WidgetDescriptor, "widget" | "refreshEveryMs">
> & {
  /** How often it refetches, at least 30 seconds (`"60s"`). */
  readonly refreshEvery?: string;
};

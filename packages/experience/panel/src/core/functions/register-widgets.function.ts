/**
 * Stackra file contract:
 * Purpose: `registerWidgets(widgets)`, how a member's generated entry hands its widget table to the panel: the web
 *          dashboard and the native widget slot render from it.
 * Boundary: writes the process-wide table; a later call replaces it whole, as a reloaded table should. Placement layers are
 *           resolved when a slot reads it, so every layer's descriptor may be registered.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 14 and 19); ADR 0306 (rules 7 and 8); the actions precedent (`registerActions`).
 */
import { WIDGET_REGISTRY } from "#core/constants/widget-registry.constant";
import type { WidgetDescriptor } from "#core/types/widget-descriptor.type";

/**
 * Records the widget table.
 *
 * @returns the table, frozen.
 * @example
 * registerWidgets(widgets); // from #stackra/resources or #stackra/widgets
 */
export function registerWidgets(widgets: readonly WidgetDescriptor[]): readonly WidgetDescriptor[] {
  const table = Object.freeze([...widgets]);
  WIDGET_REGISTRY.splice(0, WIDGET_REGISTRY.length, ...table);
  return table;
}

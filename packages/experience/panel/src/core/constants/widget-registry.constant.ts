/**
 * Stackra file contract:
 * Purpose: `WIDGET_REGISTRY`, the widget table `registerWidgets` filled, every layer's descriptors in registration order.
 * Boundary: internal: filled by `registerWidgets`, read by `widgetsFor`; a later registration replaces the table. No entry
 *           exports it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 14 and 19).
 */
import type { WidgetDescriptor } from "#core/types/widget-descriptor.type";

/** The registered widgets. */
export const WIDGET_REGISTRY: WidgetDescriptor[] = [];

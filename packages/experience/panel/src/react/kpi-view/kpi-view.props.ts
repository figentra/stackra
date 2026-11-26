/**
 * Stackra file contract:
 * Purpose: `KpiViewProps`, what `KpiView` takes: the widget, the KPI, the metric value it binds and the value of its note
 *          field.
 * Boundary: a type only, internal to the `./react` entry.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12); ADR 0307 (rule 15).
 */
import type { KpiNode } from "#core/types/kpi-node.type";
import type { WidgetDescriptor } from "#core/types/widget-descriptor.type";

/** The props of one KPI. */
export interface KpiViewProps {
  /** The widget the KPI belongs to; its key derives the label. */
  readonly widget: WidgetDescriptor;

  /** The KPI node to draw. */
  readonly kpi: KpiNode;

  /** The answer's value at the KPI's path: a metric shape. */
  readonly metric: unknown;

  /** The answer's value at the KPI's note path (a number or a string); unused without a note. */
  readonly note?: unknown;
}

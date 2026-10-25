/**
 * Stackra file contract:
 * Purpose: `Display<O>`, the builder a widget's `display(d)` member receives: a KPI, a KPI group, a progress bar, a list, a
 *          resource view or the custom renderer, every path checked against the query output `O`.
 * Boundary: a type only. The panel presents the query's answer and computes nothing (ADR 0305 rule 31).
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 14 and 15).
 */
import type { Built } from "#core/types/built.type";
import type { DisplayNode } from "#core/types/display-node.type";
import type { ElementOf } from "#core/types/element-of.type";
import type { KpiBuilder } from "#core/types/kpi-builder.type";
import type { ListPath } from "#core/types/list-path.type";
import type { ListingBuilder } from "#core/types/listing-builder.type";
import type { MetricPath } from "#core/types/metric-path.type";
import type { Path } from "#core/types/path.type";

/**
 * Builds a widget's display over query output `O`.
 *
 * @example
 * display(d: Display<OrderKpisOutput>) {
 *   return d.kpiGroup([d.kpi("revenue").icon("banknote"), d.kpi("orders").icon("receipt")]);
 * }
 */
export interface Display<O> {
  /** One metric field. */
  kpi(path: MetricPath<O>): KpiBuilder;

  /** Several KPIs in one tile. */
  kpiGroup(kpis: readonly KpiBuilder[]): Built<DisplayNode>;

  /** One metric field against its target. */
  progress(path: MetricPath<O>): Built<DisplayNode>;

  /** The rows of the list field `path`. */
  list<K extends ListPath<O>>(
    path: K,
    options: {
      readonly primary: Path<ElementOf<NonNullable<O[K]>>>;
      readonly secondary?: Path<ElementOf<NonNullable<O[K]>>>;
      readonly meta?: Path<ElementOf<NonNullable<O[K]>>>;
    },
  ): ListingBuilder;

  /** The resource view `name` of the resource whose list query this is. */
  view(name: string): ListingBuilder;

  /** The producing package's renderer. */
  custom(): Built<DisplayNode>;
}

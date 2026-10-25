/**
 * Stackra file contract:
 * Purpose: `DisplayRecord<O>`, the builder a widget's `display(d)` member receives: the runtime side of `Display<O>`.
 * Boundary: internal: the runtime side of the public builder type; no entry exports it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 14 and 15).
 */
import { WidgetDisplay } from "#core/constants/widget-display.constant";
import { KpiRecord } from "#core/records/kpi.record";
import { ListingRecord } from "#core/records/listing.record";
import type { Built } from "#core/types/built.type";
import type { Display } from "#core/types/display.type";
import type { DisplayNode } from "#core/types/display-node.type";
import type { ElementOf } from "#core/types/element-of.type";
import type { KpiBuilder } from "#core/types/kpi-builder.type";
import type { ListPath } from "#core/types/list-path.type";
import type { MetricPath } from "#core/types/metric-path.type";
import type { Path } from "#core/types/path.type";

/** Builds a widget's display over query output `O`. */
export class DisplayRecord<O> implements Display<O> {
  /** One metric field. */
  kpi(path: MetricPath<O>): KpiRecord {
    return new KpiRecord(path);
  }

  /**
   * Several KPIs in one tile.
   *
   * @throws RangeError when no KPI is given.
   */
  kpiGroup(kpis: readonly KpiBuilder[]): Built<DisplayNode> {
    if (kpis.length === 0) throw new RangeError("kpiGroup(kpis) needs at least one KPI");
    return { toNode: () => WidgetDisplay.kpiGroup(kpis.map((kpi) => kpi.toNode())) };
  }

  /** One metric field against its target. */
  progress(path: MetricPath<O>): Built<DisplayNode> {
    return { toNode: () => WidgetDisplay.progress(path) };
  }

  /** The rows of a list field. */
  list<K extends ListPath<O>>(
    path: K,
    options: {
      readonly primary: Path<ElementOf<NonNullable<O[K]>>>;
      readonly secondary?: Path<ElementOf<NonNullable<O[K]>>>;
      readonly meta?: Path<ElementOf<NonNullable<O[K]>>>;
    },
  ): ListingRecord {
    return new ListingRecord((flags) => WidgetDisplay.list({ path, ...options, ...flags }));
  }

  /** A resource view. */
  view(name: string): ListingRecord {
    return new ListingRecord((flags) => WidgetDisplay.view(name, flags));
  }

  /** The custom renderer. */
  custom(): Built<DisplayNode> {
    return { toNode: () => WidgetDisplay.custom() };
  }
}

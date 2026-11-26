/**
 * Stackra file contract:
 * Purpose: `KpiNode`, one recorded KPI: the metric field it binds, its icon, tones, drill, which direction is better and
 *          the output field its note line reads.
 * Boundary: a type only; format, unit, currency, trend, sparkline and target come from the metric type, never from here.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 15).
 */
import type { IconName } from "@stackra/icons/contracts";

import type { DisplayKind } from "#core/enums/display-kind.enum";
import type { DrillNode } from "#core/types/drill-node.type";
import type { ToneRule } from "#core/types/tone-rule.type";

/** The node of one KPI a widget draws. */
export interface KpiNode {
  /** Marks the node as a KPI. */
  readonly kind: typeof DisplayKind.Kpi;

  /** The output key typed as a metric class. */
  readonly path: string;

  /** The icon beside the label. */
  readonly icon?: IconName;

  /** The threshold tones, first match wins. */
  readonly tones?: readonly ToneRule[];

  /** Where a click goes. */
  readonly drill?: DrillNode;

  /** Whether a falling value is the good direction (a cost, a wait time). */
  readonly lowerIsBetter?: boolean;

  /** The output key, a number or a string, whose value the note line under the value words. */
  readonly note?: string;
}

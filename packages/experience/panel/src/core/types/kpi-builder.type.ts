/**
 * Stackra file contract:
 * Purpose: `KpiBuilder`, one KPI under construction: its icon, threshold tones, drill-down and better direction.
 * Boundary: a type only; chainable. Format, currency, trend, sparkline and target come from the metric type.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 15).
 */
import type { IconName } from "@stackra/icons/contracts";

import type { Built } from "#core/types/built.type";
import type { DrillNode } from "#core/types/drill-node.type";
import type { KpiNode } from "#core/types/kpi-node.type";
import type { ToneRule } from "#core/types/tone-rule.type";
import type { ToneRules } from "#core/types/tone-rules.type";

/** One KPI. */
export interface KpiBuilder extends Built<KpiNode> {
  /** The icon beside the label. */
  icon(name: IconName): this;

  /** The threshold tones, first match wins. */
  tone(build: (tone: ToneRules) => readonly ToneRule[]): this;

  /** Where a click goes. */
  drill(drill: DrillNode): this;

  /** Marks a falling value as the good direction. */
  lowerIsBetter(): this;
}

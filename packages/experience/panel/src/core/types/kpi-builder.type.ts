/**
 * Stackra file contract:
 * Purpose: `KpiBuilder<O>`, one KPI under construction: its icon, threshold tones, drill-down, better direction and the
 *          note line under its value, read from a field of the query output `O`.
 * Boundary: a type only; chainable. Format, currency, trend, sparkline and target come from the metric type; the note's
 *           words come from its derived key, never from the query.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 6 and 15).
 */
import type { IconName } from "@stackra/icons/contracts";

import type { Built } from "#core/types/built.type";
import type { DrillNode } from "#core/types/drill-node.type";
import type { KpiNode } from "#core/types/kpi-node.type";
import type { NotePath } from "#core/types/note-path.type";
import type { ToneRule } from "#core/types/tone-rule.type";
import type { ToneRules } from "#core/types/tone-rules.type";

/** The chainable builder of one KPI over query output `O`. */
export interface KpiBuilder<O = unknown> extends Built<KpiNode> {
  /** The icon beside the label. */
  icon: (name: IconName) => this;

  /** The threshold tones, first match wins. */
  tone: (build: (tone: ToneRules) => readonly ToneRule[]) => this;

  /** Where a click goes. */
  drill: (drill: DrillNode) => this;

  /** Marks a falling value as the good direction. */
  lowerIsBetter: () => this;

  /** The short line under the value: the field `path`, worded by its derived key with `{count}`. */
  note: (path: NotePath<O>) => this;
}

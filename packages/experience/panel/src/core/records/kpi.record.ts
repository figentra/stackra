/**
 * Stackra file contract:
 * Purpose: `KpiRecord`, one KPI under construction: the runtime side of `KpiBuilder`.
 * Boundary: internal: the runtime side of the public builder type; no entry exports it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 15).
 */
import type { IconName } from "@stackra/icons/contracts";

import { TONE_RULES } from "#core/constants/tone-rules.constant";
import { WidgetDisplay } from "#core/constants/widget-display.constant";
import { DraftRecord } from "#core/records/draft.record";
import type { DrillNode } from "#core/types/drill-node.type";
import type { KpiBuilder } from "#core/types/kpi-builder.type";
import type { KpiNode } from "#core/types/kpi-node.type";
import type { ToneRule } from "#core/types/tone-rule.type";
import type { ToneRules } from "#core/types/tone-rules.type";

/** The flags a KPI records. */
interface KpiFlags {
  readonly icon?: IconName;
  readonly tones?: readonly ToneRule[];
  readonly drill?: DrillNode;
  readonly lowerIsBetter?: boolean;
}

/** Records the flags of one KPI before it builds. */
export class KpiRecord extends DraftRecord<KpiFlags, KpiNode> implements KpiBuilder {
  /**
   * @param path - the output key typed as a metric class.
   */
  constructor(path: string) {
    super((flags) => WidgetDisplay.kpi(path, flags), {});
  }

  /** Sets the icon beside the label. */
  icon(name: IconName): this {
    return this.set({ icon: name });
  }

  /** The threshold tones. */
  tone(build: (tone: ToneRules) => readonly ToneRule[]): this {
    return this.set({ tones: build(TONE_RULES) });
  }

  /** Sets the drill-down the KPI opens. */
  drill(drill: DrillNode): this {
    return this.set({ drill });
  }

  /** A falling value is good. */
  lowerIsBetter(): this {
    return this.set({ lowerIsBetter: true });
  }
}

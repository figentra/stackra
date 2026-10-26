/**
 * Stackra file contract:
 * Purpose: `WidgetDisplay`, the data constructors of a widget's display, as a generated widget ref writes them
 *          (`WidgetDisplay.kpiGroup([WidgetDisplay.kpi("revenue", { icon: "banknote" })])`).
 * Boundary: pure: each returns a frozen `DisplayNode`; the display builder records through them. A list without a path
 *           reads the output's `items`.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 14 and 15); ADR 0164 (0294 note: only Custom takes a renderer).
 */
import type { IconName } from "@stackra/icons/contracts";

import { DisplayKind } from "#core/enums/display-kind.enum";
import type { DisplayNode } from "#core/types/display-node.type";
import type { DrillNode } from "#core/types/drill-node.type";
import type { KpiNode } from "#core/types/kpi-node.type";
import type { ToneRule } from "#core/types/tone-rule.type";

/**
 * Builds the display nodes that say how a widget draws its query.
 *
 * @example
 * WidgetDisplay.kpi("revenue", { icon: "banknote", tones: [{ belowTarget: 0.8, tone: Tone.Danger }] });
 * WidgetDisplay.list({ primary: "variantId", secondary: "available" });
 */
export const WidgetDisplay = Object.freeze({
  /** One metric field. */
  kpi: (
    path: string,
    options: {
      readonly icon?: IconName;
      readonly tones?: readonly ToneRule[];
      readonly drill?: DrillNode;
      readonly lowerIsBetter?: boolean;
    } = {},
  ): KpiNode =>
    Object.freeze({
      kind: DisplayKind.Kpi,
      path,
      ...options,
      ...(options.tones === undefined ? {} : { tones: Object.freeze([...options.tones]) }),
    }),

  /** Several KPIs in one tile. */
  kpiGroup: (kpis: readonly KpiNode[]): DisplayNode =>
    Object.freeze({ kind: DisplayKind.KpiGroup, kpis: Object.freeze([...kpis]) }),

  /** One metric field against its target. */
  progress: (path: string, options: { readonly icon?: IconName } = {}): DisplayNode =>
    Object.freeze({ kind: DisplayKind.Progress, path, ...options }),

  /** The rows of a list field (`items` by default). */
  list: (options: {
    readonly path?: string;
    readonly primary: string;
    readonly secondary?: string;
    readonly meta?: string;
    readonly limit?: number;
  }): DisplayNode => Object.freeze({ kind: DisplayKind.List, path: "items", ...options }),

  /** A resource's saved view. */
  view: (view: string, options: { readonly limit?: number } = {}): DisplayNode =>
    Object.freeze({ kind: DisplayKind.View, view, ...options }),

  /** The producing package's renderer. */
  custom: (): DisplayNode => Object.freeze({ kind: DisplayKind.Custom }),
});

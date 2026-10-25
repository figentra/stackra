/**
 * Stackra file contract:
 * Purpose: `DisplayNode`, a widget's recorded display: a KPI, a KPI group, a progress bar, a list, a resource view or the
 *          producing package's custom renderer.
 * Boundary: a type only; built by `WidgetDisplay.*` and the display builder, and carried by the generated widget refs.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 14, 15 and 18); ADR 0164 (0294 note: only Custom takes a renderer).
 */
import type { IconName } from "@stackra/icons/contracts";

import type { DisplayKind } from "#core/enums/display-kind.enum";
import type { KpiNode } from "#core/types/kpi-node.type";

/** A widget's display. */
export type DisplayNode =
  | KpiNode
  | {
      /** Several KPIs in one tile. */
      readonly kind: typeof DisplayKind.KpiGroup;
      /** The KPIs in order. */
      readonly kpis: readonly KpiNode[];
    }
  | {
      /** One metric against its target. */
      readonly kind: typeof DisplayKind.Progress;
      /** The output key typed as a metric class. */
      readonly path: string;
      /** The icon beside the label. */
      readonly icon?: IconName;
    }
  | {
      /** The rows of a list field. */
      readonly kind: typeof DisplayKind.List;
      /** The output key of the list. */
      readonly path: string;
      /** The item path of the first line. */
      readonly primary: string;
      /** The item path of the second line. */
      readonly secondary?: string;
      /** The item path of the value at the end of the row. */
      readonly meta?: string;
      /** The most rows shown. */
      readonly limit?: number;
    }
  | {
      /** A resource's saved view, with its columns and row actions. */
      readonly kind: typeof DisplayKind.View;
      /** The view name. */
      readonly view: string;
      /** The most rows shown. */
      readonly limit?: number;
    }
  | {
      /** The producing package's renderer, bound by the widget's name. */
      readonly kind: typeof DisplayKind.Custom;
    };

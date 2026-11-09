/**
 * Stackra file contract:
 * Purpose: `useWidgetDisplay(props)`, a widget's display as data on either entry: its KPIs (one, or a group) with their
 *          metrics and note values, a progress bar's value against the target (out of one for a percent metric
 *          without a target), the rows of a list as text, the Custom renderer's element over the answer, or the "not
 *          shown here" words.
 * Boundary: platform-free: imports `react` and no UI kit, so the web `WidgetBody` and the native widget content draw the
 *           same display with their own kit. Presents the answer and computes nothing beyond it. shortcut: a View
 *           display is "not shown here" until the resource table renderer is built.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 14 and 15); ADR 0164 (0294 note: only Custom takes a renderer); ADR 0305 (rule 31).
 */
import { useNumber, useTranslation } from "@stackra/i18n/react";
import { createElement, type ComponentType, type ReactElement } from "react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { DisplayKind } from "#core/enums/display-kind.enum";
import { MetricFormat } from "#core/enums/metric-format.enum";
import { valueAt } from "#core/functions/value-at.function";
import { widgetTitle } from "#core/functions/widget-title.function";
import type { CustomWidgetProps } from "#core/types/custom-widget-props.type";
import type { KpiNode } from "#core/types/kpi-node.type";
import type { WidgetBodyProps } from "#react/widget-body/widget-body.props";

/** A value as row text. */
function textOf(value: unknown, number: (value: number) => string): string {
  if (typeof value === "number") return number(value);
  if (value instanceof Date) return value.toISOString();
  return value === undefined || value === null ? "" : String(value);
}

/** One KPI with the answer's values it draws. */
interface KpiEntry {
  /** The KPI node. */
  readonly kpi: KpiNode;

  /** The answer's value at the KPI's path. */
  readonly metric: unknown;

  /** The answer's value at the KPI's note path; undefined without a note. */
  readonly note: unknown;
}

/** The entry of `kpi` over the answer `data`. */
function kpiEntryOf(kpi: KpiNode, data: unknown): KpiEntry {
  return {
    kpi,
    metric: valueAt(data, kpi.path),
    note: kpi.note === undefined ? undefined : valueAt(data, kpi.note),
  };
}

/**
 * The display of `widget` over `data`.
 *
 * @example
 * const display = useWidgetDisplay({ widget, data: answer.data, isRefreshing: answer.isFetching });
 */
export function useWidgetDisplay({ widget, data, isRefreshing }: WidgetBodyProps):
  | {
      readonly kind: "kpis";
      readonly isGroup: boolean;
      readonly kpis: readonly KpiEntry[];
    }
  | {
      readonly kind: "progress";
      readonly label: string;
      readonly progress: { readonly value?: number; readonly maxValue?: number };
    }
  | {
      readonly kind: "list";
      readonly label: string;
      readonly emptyTitle: string;
      readonly items: readonly {
        readonly id: string;
        readonly title: string;
        readonly description?: string;
        readonly meta?: string;
      }[];
    }
  | { readonly kind: "custom"; readonly element: ReactElement }
  | { readonly kind: "none"; readonly title: string } {
  const { t } = useTranslation();
  const number = useNumber();
  const display = widget.display;
  switch (display.kind) {
    case DisplayKind.Kpi: {
      return {
        kind: "kpis",
        isGroup: false,
        kpis: [kpiEntryOf(display, data)],
      };
    }
    case DisplayKind.KpiGroup: {
      return {
        kind: "kpis",
        isGroup: true,
        kpis: display.kpis.map((kpi) => kpiEntryOf(kpi, data)),
      };
    }
    case DisplayKind.Progress: {
      const value = valueAt(data, `${display.path}.value`);
      const target = valueAt(data, `${display.path}.target`);
      // a percent metric's ratio fills a bar out of one, not the kit's default of a hundred
      const isPercent = valueAt(data, `${display.path}.format`) === MetricFormat.Percent;
      const maxValue = typeof target === "number" ? target : isPercent ? 1 : undefined;
      return {
        kind: "progress",
        label: t(widgetTitle(widget.key, display.path)),
        progress: {
          ...(typeof value === "number" ? { value } : {}),
          ...(maxValue === undefined ? {} : { maxValue }),
        },
      };
    }
    case DisplayKind.List: {
      const rows = valueAt(data, display.path);
      const list: readonly unknown[] = Array.isArray(rows) ? rows : [];
      return {
        kind: "list",
        label: t(widget.title),
        emptyTitle: t(PANEL_KEYS.panel.widgets.empty),
        items: list.slice(0, display.limit ?? list.length).map((row, index) => ({
          id: textOf(valueAt(row, "id"), String) || String(index),
          title: textOf(valueAt(row, display.primary), number),
          ...(display.secondary === undefined
            ? {}
            : { description: textOf(valueAt(row, display.secondary), number) }),
          ...(display.meta === undefined
            ? {}
            : { meta: textOf(valueAt(row, display.meta), number) }),
        })),
      };
    }
    case DisplayKind.Custom: {
      if (widget.renderer !== undefined)
        return {
          kind: "custom",
          element: createElement(widget.renderer as ComponentType<CustomWidgetProps>, {
            data,
            isRefreshing,
          }),
        };
      return { kind: "none", title: t(PANEL_KEYS.panel.widgets.not_rendered) };
    }
    default: {
      return { kind: "none", title: t(PANEL_KEYS.panel.widgets.not_rendered) };
    }
  }
}

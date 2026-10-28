/**
 * Stackra file contract:
 * Purpose: `WidgetBody`, a widget's display on the web: a KPI, a KPI group, a progress bar against the target, the rows of a
 *          list, or the Custom renderer with the answer.
 * Boundary: internal to the `./react` entry; presents the answer and computes nothing beyond the change ratio the metric
 *           type implies. shortcut: a View display shows the "not shown here" state, because the resource table
 *           renderer is not built yet; it renders the resource's view once that lands.
 * Runtime: browser
 * Governing contract: ADR 0307 (rules 14 and 15); ADR 0164 (0294 note: only Custom takes a renderer); ADR 0305 (rule 31).
 */
import { useNumber, useTranslation } from "@stackra/i18n/react";
import { EmptyState, List, ProgressBar } from "@stackra/ui/react";
import { createElement, type ComponentType, type ReactElement } from "react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { DisplayKind } from "#core/enums/display-kind.enum";
import { valueAt } from "#core/functions/value-at.function";
import { widgetTitle } from "#core/functions/widget-title.function";
import type { CustomWidgetProps } from "#core/types/custom-widget-props.type";
import { KpiView } from "#react/kpi-view/kpi-view";
import type { WidgetBodyProps } from "#react/widget-body/widget-body.props";

/** A value as row text. */
function textOf(value: unknown, number: (value: number) => string): string {
  if (typeof value === "number") return number(value);
  if (value instanceof Date) return value.toISOString();
  return value === undefined || value === null ? "" : String(value);
}

/**
 * The display of `widget` over `data`.
 *
 * @example
 * <WidgetBody widget={widget} data={answer.data} isRefreshing={answer.isFetching} />
 */
export function WidgetBody({ widget, data, isRefreshing }: WidgetBodyProps): ReactElement {
  const { t } = useTranslation();
  const number = useNumber();
  const display = widget.display;
  switch (display.kind) {
    case DisplayKind.Kpi: {
      return <KpiView widget={widget} kpi={display} metric={valueAt(data, display.path)} />;
    }
    case DisplayKind.KpiGroup: {
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          {display.kpis.map((kpi) => (
            <KpiView key={kpi.path} widget={widget} kpi={kpi} metric={valueAt(data, kpi.path)} />
          ))}
        </div>
      );
    }
    case DisplayKind.Progress: {
      const value = valueAt(data, `${display.path}.value`);
      const target = valueAt(data, `${display.path}.target`);
      return (
        <ProgressBar
          label={t(widgetTitle(widget.key, display.path))}
          isLabelVisible
          {...(typeof value === "number" ? { value } : {})}
          {...(typeof target === "number" ? { maxValue: target } : {})}
        />
      );
    }
    case DisplayKind.List: {
      const rows = valueAt(data, display.path);
      const list: readonly unknown[] = Array.isArray(rows) ? rows : [];
      const items = list.slice(0, display.limit ?? list.length).map((row, index) => ({
        id: textOf(valueAt(row, "id"), String) || String(index),
        title: textOf(valueAt(row, display.primary), number),
        ...(display.secondary === undefined
          ? {}
          : { description: textOf(valueAt(row, display.secondary), number) }),
        ...(display.meta === undefined
          ? {}
          : { endContent: textOf(valueAt(row, display.meta), number) }),
      }));
      return (
        <List
          label={t(widget.title)}
          items={items}
          emptyState={<EmptyState title={t(PANEL_KEYS.panel.widgets.empty)} />}
        />
      );
    }
    case DisplayKind.Custom: {
      if (widget.renderer !== undefined)
        return createElement(widget.renderer as ComponentType<CustomWidgetProps>, {
          data,
          isRefreshing,
        });
      return <EmptyState title={t(PANEL_KEYS.panel.widgets.not_rendered)} />;
    }
    default: {
      return <EmptyState title={t(PANEL_KEYS.panel.widgets.not_rendered)} />;
    }
  }
}

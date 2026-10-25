/**
 * Stackra file contract:
 * Purpose: `WidgetContent`, a widget's display on native: a KPI or a KPI group (value from the metric type, change against
 *          the previous period, threshold tone, target), a progress bar, the rows of a list, or the Custom renderer.
 * Boundary: internal to the `./native` entry; presents the answer and computes nothing beyond the change ratio. shortcut:
 *           a View display shows the "not shown here" state until the resource table renderer is built.
 * Runtime: react-native
 * Governing contract: ADR 0307 (rules 14 and 15); ADR 0164 (0294 note); ADR 0220 (money in minor units).
 */
import { Tone } from "@stackra/contracts";
import { useMoney, useNumber, useTranslation } from "@stackra/i18n/react";
import { Chip, EmptyState, List, ProgressBar, Text } from "@stackra/ui/native";
import { createElement, type ComponentType, type ReactElement } from "react";
import { View } from "react-native";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { DisplayKind } from "#core/enums/display-kind.enum";
import { changeOf } from "#core/functions/change-of.function";
import { toneOf } from "#core/functions/tone-of.function";
import { valueAt } from "#core/functions/value-at.function";
import { widgetTitle } from "#core/functions/widget-title.function";
import type { CustomWidgetProps } from "#core/types/custom-widget-props.type";
import type { KpiNode } from "#core/types/kpi-node.type";
import type { WidgetDescriptor } from "#core/types/widget-descriptor.type";
import type { WidgetContentProps } from "#native/widget-content/widget-content.props";

/** A metric as the answer carries it. */
interface MetricShape {
  readonly value: number | null;
  readonly previous: number | null;
  readonly target: number | null;
  readonly currency?: string;
}

/** Whether `value` is a metric shape. */
const isMetric = (value: unknown): value is MetricShape =>
  typeof value === "object" && value !== null && "value" in value && "previous" in value;

/** One KPI of `widget` over `metric`. */
function Kpi({
  widget,
  kpi,
  metric,
}: {
  readonly widget: WidgetDescriptor;
  readonly kpi: KpiNode;
  readonly metric: unknown;
}): ReactElement {
  const { t } = useTranslation();
  const money = useMoney();
  const number = useNumber();
  const label = t(widgetTitle(widget.key, kpi.path));
  if (!isMetric(metric) || metric.value === null)
    return (
      <View className="flex-1 gap-1">
        <Text tone="muted">{label}</Text>
        <Text>{"—"}</Text>
      </View>
    );
  const format = (value: number): string =>
    metric.currency === undefined ? number(value) : money(value, metric.currency);
  const change = changeOf({ value: metric.value, previous: metric.previous ?? null });
  const isBetter = change !== null && change !== 0 && change > 0 !== (kpi.lowerIsBetter === true);
  const tone = toneOf({ value: metric.value, target: metric.target ?? null }, kpi.tones ?? []);
  return (
    <View className="flex-1 gap-1">
      <Text tone="muted">{label}</Text>
      <Text tone={tone ?? "default"}>{format(metric.value)}</Text>
      {change !== null && change !== 0 && (
        <Chip size="sm" tone={isBetter ? Tone.Success : Tone.Danger}>
          {t(PANEL_KEYS.panel.widgets.change, {
            change: number(change, {
              style: "percent",
              maximumFractionDigits: 1,
              signDisplay: "exceptZero",
            }),
          })}
        </Chip>
      )}
      {metric.target !== null && metric.target !== undefined && (
        <Text type="small" tone="muted">
          {t(PANEL_KEYS.panel.widgets.target, { target: format(metric.target) })}
        </Text>
      )}
    </View>
  );
}

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
 * <WidgetContent widget={widget} data={answer.data} isRefreshing={answer.isFetching} />
 */
export function WidgetContent({ widget, data, isRefreshing }: WidgetContentProps): ReactElement {
  const { t } = useTranslation();
  const number = useNumber();
  const display = widget.display;
  switch (display.kind) {
    case DisplayKind.Kpi:
      return <Kpi widget={widget} kpi={display} metric={valueAt(data, display.path)} />;
    case DisplayKind.KpiGroup:
      return (
        <View className="flex-row gap-3">
          {display.kpis.map((kpi) => (
            <Kpi key={kpi.path} widget={widget} kpi={kpi} metric={valueAt(data, kpi.path)} />
          ))}
        </View>
      );
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
          : { endContent: <Text>{textOf(valueAt(row, display.meta), number)}</Text> }),
      }));
      return (
        <List
          label={t(widget.title)}
          items={items}
          emptyState={<EmptyState title={t(PANEL_KEYS.panel.widgets.empty)} />}
        />
      );
    }
    case DisplayKind.Custom:
      if (widget.renderer !== undefined)
        return createElement(widget.renderer as ComponentType<CustomWidgetProps>, {
          data,
          isRefreshing,
        });
      return <EmptyState title={t(PANEL_KEYS.panel.widgets.not_rendered)} />;
    default:
      return <EmptyState title={t(PANEL_KEYS.panel.widgets.not_rendered)} />;
  }
}

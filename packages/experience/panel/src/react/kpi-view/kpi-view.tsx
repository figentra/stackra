/**
 * Stackra file contract:
 * Purpose: `KpiView`, one KPI on the web: the label, the value formatted from its metric type (money in its currency, a
 *          count as a number), the change against the previous period coloured by the better direction, the threshold
 *          tone and the target.
 * Boundary: internal to the `./react` entry; computes nothing the metric does not carry beyond the change ratio. shortcut:
 *           the drill-down and the sparkline are not drawn yet (the route of a resource class and a free chart
 *           component are still to come); the KPI shows the series' numbers only through its value.
 * Runtime: browser
 * Governing contract: ADR 0307 (rule 15); ADR 0220 (money in minor units).
 */
import { Tone } from "@stackra/contracts";
import { useMoney, useNumber, useTranslation } from "@stackra/i18n/react";
import { Chip, Icon, Text } from "@stackra/ui/react";
import type { ReactElement } from "react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { changeOf } from "#core/functions/change-of.function";
import { toneOf } from "#core/functions/tone-of.function";
import { widgetTitle } from "#core/functions/widget-title.function";
import type { KpiViewProps } from "#react/kpi-view/kpi-view.props";

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

/**
 * One KPI.
 *
 * @example
 * <KpiView widget={widget} kpi={kpi} metric={answer.revenue} />
 */
export function KpiView({ widget, kpi, metric }: KpiViewProps): ReactElement {
  const { t } = useTranslation();
  const money = useMoney();
  const number = useNumber();
  const label = t(widgetTitle(widget.key, kpi.path));
  if (!isMetric(metric) || metric.value === null)
    return (
      <div className="flex flex-col gap-1">
        <Text tone="muted">{label}</Text>
        <Text>{"—"}</Text>
      </div>
    );
  const format = (value: number): string =>
    metric.currency === undefined ? number(value) : money(value, metric.currency);
  const change = changeOf({ value: metric.value, previous: metric.previous ?? null });
  const isBetter = change !== null && change !== 0 && change > 0 !== (kpi.lowerIsBetter === true);
  const tone = toneOf({ value: metric.value, target: metric.target ?? null }, kpi.tones ?? []);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {kpi.icon !== undefined && <Icon name={kpi.icon} aria-hidden />}
        <Text tone="muted">{label}</Text>
      </div>
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
    </div>
  );
}

/**
 * Stackra file contract:
 * Purpose: `useKpi(props)`, one KPI as text on either entry: its label, then (when the answer carries a value) the value
 *          formatted from its metric type (money in its currency, a count as a number) with its threshold tone, the
 *          change against the previous period with the tone of the better direction, and the target.
 * Boundary: platform-free: imports `react` hooks and no UI kit, so the web `KpiView` and the native widget content draw
 *           the same KPI with their own kit. Computes nothing the metric does not carry beyond the change ratio.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 15); ADR 0220 (money in minor units); ADR 0164.
 */
import { Tone } from "@stackra/contracts";
import { useMoney, useNumber, useTranslation } from "@stackra/i18n/react";

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
 * The words of one KPI; `value` is absent when the answer carries none.
 *
 * @example
 * const kpi = useKpi({ widget, kpi: node, metric: answer.revenue });
 */
export function useKpi({ widget, kpi, metric }: KpiViewProps): {
  readonly label: string;
  readonly value?: string;
  readonly tone?: Tone | undefined;
  readonly change?: { readonly text: string; readonly tone: Tone } | undefined;
  readonly target?: string | undefined;
} {
  const { t } = useTranslation();
  const money = useMoney();
  const number = useNumber();
  const label = t(widgetTitle(widget.key, kpi.path));
  if (!isMetric(metric) || metric.value === null) return { label };
  const format = (value: number): string =>
    metric.currency === undefined ? number(value) : money(value, metric.currency);
  const change = changeOf({ value: metric.value, previous: metric.previous ?? null });
  const isBetter = change !== null && change !== 0 && change > 0 !== (kpi.lowerIsBetter === true);
  return {
    label,
    value: format(metric.value),
    tone: toneOf({ value: metric.value, target: metric.target ?? null }, kpi.tones ?? []),
    change:
      change === null || change === 0
        ? undefined
        : {
            text: t(PANEL_KEYS.panel.widgets.change, {
              change: number(change, {
                style: "percent",
                maximumFractionDigits: 1,
                signDisplay: "exceptZero",
              }),
            }),
            tone: isBetter ? Tone.Success : Tone.Danger,
          },
    target:
      metric.target === null || metric.target === undefined
        ? undefined
        : t(PANEL_KEYS.panel.widgets.target, { target: format(metric.target) }),
  };
}

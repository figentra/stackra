/**
 * Stackra file contract:
 * Purpose: `useKpi(props)`, one KPI as text on either entry: its label, the note line under the value when the KPI has
 *          one, then (when the answer carries a value) the value formatted from its metric type (money in its currency,
 *          a percent metric's ratio as a percent, a count as a number) with its threshold tone, the change against the
 *          previous period with the tone of the better direction (in percentage points for a percent), and the target.
 * Boundary: platform-free: imports `react` hooks and no UI kit, so the web `KpiView` and the native widget content draw
 *           the same KPI with their own kit. Computes nothing the metric does not carry beyond the change. The note's
 *           words are its derived key's; an empty message hides it, so a catalogue can drop a zero count.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 6 and 15); ADR 0220 (money in minor units); ADR 0164.
 */
import { Tone } from "@stackra/contracts";
import { useMoney, useNumber, useTranslation } from "@stackra/i18n/react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { MetricFormat } from "#core/enums/metric-format.enum";
import { changeOf } from "#core/functions/change-of.function";
import { pointChangeOf } from "#core/functions/point-change-of.function";
import { toneOf } from "#core/functions/tone-of.function";
import { widgetTitle } from "#core/functions/widget-title.function";
import type { KpiViewProps } from "#react/kpi-view/kpi-view.props";

/** A metric as the answer carries it. */
interface MetricShape {
  readonly value: number | null;
  readonly previous: number | null;
  readonly target: number | null;
  readonly currency?: string;
  readonly format?: string;
}

/** Whether `value` is a metric shape. */
const isMetric = (value: unknown): value is MetricShape =>
  typeof value === "object" && value !== null && "value" in value && "previous" in value;

/** The interpolation values of a note field, or undefined when it holds nothing to say. */
const noteValuesOf = (note: unknown): Readonly<Record<string, number | string>> | undefined => {
  if (typeof note === "number" && Number.isFinite(note)) return { count: note };
  if (typeof note === "string" && note !== "") return { value: note };
  return undefined;
};

/**
 * The words of one KPI; `value` is absent when the answer carries none, `note` when the KPI has none to show.
 *
 * @example
 * const kpi = useKpi({ widget, kpi: node, metric: answer.revenue, note: answer.spendOtherCurrencies });
 */
export function useKpi({ widget, kpi, metric, note }: KpiViewProps): {
  readonly label: string;
  readonly note?: string | undefined;
  readonly value?: string;
  readonly tone?: Tone | undefined;
  readonly change?: { readonly text: string; readonly tone: Tone } | undefined;
  readonly target?: string | undefined;
} {
  const { t } = useTranslation();
  const money = useMoney();
  const number = useNumber();
  const label = t(widgetTitle(widget.key, kpi.path));
  const noteValues = kpi.note === undefined ? undefined : noteValuesOf(note);
  const noteText =
    kpi.note === undefined || noteValues === undefined
      ? undefined
      : t(widgetTitle(widget.key, kpi.note), noteValues);
  const words = { label, note: noteText === "" ? undefined : noteText };
  if (!isMetric(metric) || metric.value === null) return words;
  const isPercent = metric.format === MetricFormat.Percent;
  const format = (value: number): string => {
    if (isPercent) return number(value, { style: "percent", maximumFractionDigits: 1 });
    return metric.currency === undefined ? number(value) : money(value, metric.currency);
  };
  const ratios = { value: metric.value, previous: metric.previous ?? null };
  // a rate's relative change reads like a rate (60% to 67% is "+11.7%"), so it moves in points
  const change = isPercent ? pointChangeOf(ratios) : changeOf(ratios);
  const isBetter = change !== null && change !== 0 && change > 0 !== (kpi.lowerIsBetter === true);
  const changeText = (value: number): string =>
    isPercent
      ? t(PANEL_KEYS.panel.widgets.change_points, {
          change: number(value, { maximumFractionDigits: 1, signDisplay: "exceptZero" }),
        })
      : t(PANEL_KEYS.panel.widgets.change, {
          change: number(value, {
            style: "percent",
            maximumFractionDigits: 1,
            signDisplay: "exceptZero",
          }),
        });
  return {
    ...words,
    value: format(metric.value),
    tone: toneOf({ value: metric.value, target: metric.target ?? null }, kpi.tones ?? []),
    change:
      change === null || change === 0
        ? undefined
        : { text: changeText(change), tone: isBetter ? Tone.Success : Tone.Danger },
    target:
      metric.target === null || metric.target === undefined
        ? undefined
        : t(PANEL_KEYS.panel.widgets.target, { target: format(metric.target) }),
  };
}

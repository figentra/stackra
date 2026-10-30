/**
 * Stackra file contract:
 * Purpose: `useCartesianChart`, what the web area, bar, line and composed charts share beyond their parts: the locale,
 *          the series hidden through the legend, the previous-period twins, the data table (twins included), the
 *          reference notes, and the `ChartFrame` props that wire them.
 * Boundary: a React hook; draws nothing.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); WCAG 2.2 SC 1.1.1 and 4.1.2; STA-1371.
 */
import type { CartesianChartContractProps } from "#contracts/types/cartesian-chart-contract-props.type";
import type { ChartDatum } from "#contracts/types/chart-datum.type";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { chartAnnotationTextOf } from "#core/functions/chart-annotation-text-of.function";
import { chartReferenceTextOf } from "#core/functions/chart-reference-text-of.function";
import { chartTableOf } from "#core/functions/chart-table-of.function";
import type { ChartFrameProps } from "#react/chart/chart-frame.props";
import { comparedSeriesOf } from "#react/chart/compared-series-of.function";
import type { ComparedSeries } from "#react/chart/compared-series.type";
import { useChartLocale } from "#react/chart/use-chart-locale";
import { useSeriesToggle } from "#react/chart/use-series-toggle";
import { useUiText } from "#react/hooks/use-ui-text";

/** The shared state of one cartesian chart. */
export function useCartesianChart(
  props: CartesianChartContractProps & { readonly className?: string | undefined },
  rows: readonly ChartDatum[] = props.data,
): {
  readonly locale: string;
  readonly isRtl: boolean;
  readonly hidden: readonly string[];
  readonly compared: readonly ComparedSeries[];
  /** The brush's name. */
  readonly brushLabel: string;
  readonly frame: Omit<ChartFrameProps, "children">;
} {
  const { series, label, xKey, xFormat, valueFormat } = props;
  const { locale, isRtl, words } = useChartLocale();
  const t = useUiText();
  const { hidden, toggle } = useSeriesToggle();
  const compared = comparedSeriesOf(series, props.showComparison, (item) =>
    t(UI_KEYS.ui.chart.previous, { series: item.label }),
  );
  const table = chartTableOf({
    data: rows,
    series: [...series, ...compared.map(({ key, label: name }) => ({ key, label: name }))],
    categoryKey: xKey,
    locale,
    valueFormat,
    categoryFormat: xFormat,
    words,
  });
  return {
    locale,
    isRtl,
    hidden,
    compared,
    brushLabel: t(UI_KEYS.ui.chart.zoom),
    frame: {
      label,
      table,
      legend: (props.showLegend ?? (series.length > 1 || compared.length > 0)) ? series : [],
      palette: props.palette,
      className: props.className,
      onToggle: toggle,
      hiddenKeys: hidden,
      showComparison: compared.length > 0,
      notes: [
        ...(props.references ?? []).map((item) => chartReferenceTextOf(item, locale, valueFormat)),
        ...(props.annotations ?? []).map((item) => chartAnnotationTextOf(item, locale, xFormat)),
      ],
    },
  };
}

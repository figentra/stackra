/**
 * Stackra file contract:
 * Purpose: `CartesianFigure`, the native area, line and column chart on Victory Native, in the quiet chart style:
 *          series in the accent ramp (or the palette asked for); areas fade from 35% to clear under a 2px monotone
 *          edge; columns, grouped or stacked, round only their data end; 10px muted category labels, no axis lines,
 *          a horizontal grid of the muted colour at 15%; and, while pressed, a 1px muted 4/4 dashed cursor with each
 *          series' dot in a 2px surface ring (a 5% foreground block behind a column) and the readout card.
 * Boundary: right to left the categories run from the right and the value axis sits on the right. Labels are Skia
 *           paragraphs, which shape Arabic and fall back to a system face that has Arabic-Indic digits. Paths ease
 *           in only when Reduce Motion is off.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 */
import {
  Circle,
  DashPathEffect,
  Group,
  LinearGradient,
  Line as SkiaLine,
  Rect,
  Skia,
  TextAlign,
  vec,
} from "@shopify/react-native-skia";
import { Fragment, type ReactElement, type ReactNode, useMemo, useState } from "react";
import { View } from "react-native";
import {
  runOnJS,
  useAnimatedReaction,
  useDerivedValue,
  useReducedMotion,
} from "react-native-reanimated";
import {
  Area,
  Bar,
  BarGroup,
  CartesianChart,
  type ChartBounds,
  type ChartPressState,
  type PointsArray,
  createParagraphLabelRenderer,
  Line,
  Scatter,
  StackedArea,
  StackedBar,
  useChartPressState,
} from "victory-native";

import { chartColorOf } from "#core/functions/chart-color-of.function";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { chartReferenceTextOf } from "#core/functions/chart-reference-text-of.function";
import { chartTableOf } from "#core/functions/chart-table-of.function";
import { chartTextOf } from "#core/functions/chart-text-of.function";
import { formatChartCategory } from "#core/functions/format-chart-category.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { sortChartItems } from "#core/functions/sort-chart-items.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { comparedSeriesOf } from "#react/chart/compared-series-of.function";
import { useSeriesToggle } from "#react/chart/use-series-toggle";
import { alphaOf } from "#native/chart/alpha-of.function";
import type { CartesianFigureProps } from "#native/chart/cartesian-figure.props";
import { ChartFrame } from "#native/chart/chart-frame";
import { ChartReadout } from "#native/chart/chart-readout";
import { useChartLocale } from "#native/chart/use-chart-locale";
import { useChartPaint } from "#native/chart/use-chart-paint";

/** The width allowed per character of an axis label at 11 points. */
const LABEL_CHAR_WIDTH = 6.5;

/** A loose Victory row: the category and one number per series. */
type Row = Record<string, string | number | null>;
/** The press state of any series set. */
type PressState = ChartPressState<{ x: string | number; y: Record<string, number> }>;

/** `color` at `alpha`, for a gradient stop. */
function faded(color: string, alpha: number): Float32Array {
  const [red = 0, green = 0, blue = 0] = Skia.Color(color);
  return Float32Array.of(red, green, blue, alpha);
}

/**
 * Victory Native's chart, typed for rows whose keys are known only at run time: its generics need the row type's
 * keys at compile time, which a series config does not give.
 */
const Chart = CartesianChart as unknown as (props: {
  readonly children: (args: {
    readonly points: Record<string, PointsArray>;
    readonly chartBounds: ChartBounds;
    readonly yScale: (value: number) => number;
  }) => ReactNode;
  readonly [prop: string]: unknown;
}) => ReactElement;

/** The pressed row's guide: a 1px muted line dashed 4/4 through a line or area chart. */
function Cursor({
  state,
  bounds,
  color,
}: {
  state: PressState;
  bounds: ChartBounds;
  color: string;
}) {
  const from = useDerivedValue(() => vec(state.x.position.value, bounds.top));
  const to = useDerivedValue(() => vec(state.x.position.value, bounds.bottom));
  return (
    <SkiaLine p1={from} p2={to} color={color} strokeWidth={1}>
      <DashPathEffect intervals={[4, 4]} />
    </SkiaLine>
  );
}

/** The pressed column's soft block: the foreground at 5% behind the whole category. */
function CursorBlock(props: {
  state: PressState;
  bounds: ChartBounds;
  band: number;
  color: string;
}) {
  const { state, bounds, band, color } = props;
  const x = useDerivedValue(() => state.x.position.value - band / 2);
  return (
    <Rect x={x} y={bounds.top} width={band} height={bounds.bottom - bounds.top} color={color} />
  );
}

/** The pressed point of one series: its colour inside a 2px ring of the surface. */
function ActiveDot(props: { state: PressState; seriesKey: string; color: string; ring: string }) {
  const { state, seriesKey, color, ring } = props;
  const cx = useDerivedValue(() => state.x.position.value);
  const cy = useDerivedValue(() => state.y[seriesKey]?.position.value ?? 0);
  return (
    <Group>
      <Circle cx={cx} cy={cy} r={6} color={ring} />
      <Circle cx={cx} cy={cy} r={4} color={color} />
    </Group>
  );
}

/** Areas, lines or columns over a category axis. */
export function CartesianFigure(props: CartesianFigureProps): ReactElement {
  const { data, series, label, xKey, xFormat, valueFormat, kind, height = 240, palette } = props;
  // Victory names the monotone curve after its axis.
  const curve = props.curve === undefined || props.curve === "monotone" ? "monotoneX" : props.curve;
  const { locale, isRtl, words } = useChartLocale();
  const t = useUiText();
  const isReduced = useReducedMotion();
  const paint = useChartPaint([
    ...series.map((item, index) => chartColorOf(item, index, palette)),
    // Each reference's own colour after the series' (the muted text colour stands in when it has none).
    ...(props.references ?? []).map((item) =>
      item.color === undefined || item.color === "muted" ? "accent" : item.color,
    ),
  ]);
  const { hidden, toggle } = useSeriesToggle();
  // Previous-period twins: dashed lines on line and area charts, faded bars beside unstacked columns.
  const compared = comparedSeriesOf(
    kind === "bar" && props.stacked === true ? [] : series,
    props.showComparison,
    (item) => t(UI_KEYS.ui.chart.previous, { series: item.label }),
  ).filter((twin) => !hidden.includes(twin.series.key));
  // Hidden series leave the plot but keep their colour by position.
  const shown = series
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !hidden.includes(item.key));
  const keys = [...shown.map(({ item }) => item.key), ...compared.map((twin) => twin.key)];
  const sorted = useMemo(
    () =>
      kind === "bar"
        ? sortChartItems(
            data,
            props.sort,
            (row) => series.reduce((sum, item) => sum + (Number(row[item.key]) || 0), 0),
            (row) => formatChartCategory(row[xKey], locale, xFormat),
            locale,
          )
        : [...data],
    [data, kind, props.sort, series, xKey, locale, xFormat],
  );
  const isShare = props.stacked === true && props.isNormalized === true && kind !== "line";
  // The raw rows in drawing order (the readout reads them), and the rows drawn: shares of each total when 100%-stacked.
  const raw = useMemo(() => {
    const copy = sorted.map((row) => ({ ...row }) as Row);
    // oxlint-disable-next-line unicorn/no-array-reverse -- reverses an array built here, which nothing else holds; toReversed is ES2023 and the base lib is ES2022
    return isRtl ? copy.reverse() : copy;
  }, [sorted, isRtl]);
  const rows = useMemo(
    () =>
      isShare
        ? raw.map((row) => {
            const total = series.reduce((sum, item) => sum + (Number(row[item.key]) || 0), 0);
            return {
              ...row,
              ...Object.fromEntries(
                series.map((item) => [
                  item.key,
                  total > 0 ? (Number(row[item.key]) || 0) / total : 0,
                ]),
              ),
            } as Row;
          })
        : raw,
    [raw, isShare, series],
  );
  const { state, isActive } = useChartPressState({
    x: "" as string | number,
    // Every key the plot can ever draw, so hiding a series or turning the comparison on keeps a press state for each.
    y: Object.fromEntries(
      series
        .flatMap((item) => [item.key, ...(item.compareKey ? [item.compareKey] : [])])
        .map((key) => [key, 0]),
    ),
  });
  const [pressed, setPressed] = useState(-1);
  useAnimatedReaction(
    () => (state.isActive.value ? state.matchedIndex.value : -1),
    (index, previous) => {
      if (index !== previous) runOnJS(setPressed)(index);
    },
  );
  const labels = useMemo(
    () =>
      createParagraphLabelRenderer({
        // One centred line in a box a little wider than the text: laid out to its exact intrinsic width, shaped
        // Arabic wraps to two lines; a fixed wide box crowds neighbours out.
        paragraphStyle: { maxLines: 1, textAlign: TextAlign.Center },
        // oxlint-disable-next-line react/capitalized-calls -- Skia.Color is Skia's colour parser, a namespace method, not a component
        textStyle: { fontSize: 10, color: Skia.Color(paint.muted) },
        maxWidth: ({ text }) => text.length * LABEL_CHAR_WIDTH + 8,
      }),
    [paint.muted],
  );
  const animate = isReduced ? undefined : ({ type: "timing", duration: 300 } as const);
  const category = (value: unknown) => formatChartCategory(value, locale, xFormat);
  const value = (figure: number) => formatChartNumber(figure, locale, valueFormat);
  const table = chartTableOf({
    data: sorted,
    series: [...series, ...compared.map(({ key, label: name }) => ({ key, label: name }))],
    categoryKey: xKey,
    locale,
    valueFormat,
    categoryFormat: xFormat,
    words,
  });
  const notes = (props.references ?? []).map((item) =>
    chartReferenceTextOf(item, locale, valueFormat),
  );
  const row = isActive ? raw[pressed] : undefined;
  const isStacked = props.stacked === true;
  // Victory scales a stack to its tallest series, not its tallest sum, so a stack states its own top.
  const stackTop = Math.max(
    1,
    ...rows.map((datum) =>
      shown.reduce((sum, { item }) => sum + (Number(datum[item.key]) || 0), 0),
    ),
  );
  // A reference above the data still shows: the value axis reaches it.
  const referenceTop = Math.max(
    0,
    ...(props.references ?? []).map((item) => item.value ?? item.to ?? 0),
  );
  const values = rows.flatMap((datum) =>
    keys.map((key) => Number(datum[key])).filter(Number.isFinite),
  );
  // One label per row up to six; past six, five labels centred in equal spans, clear of the plot's edges.
  const step = rows.length <= 6 ? 1 : Math.ceil(rows.length / 5);
  const ticks = rows
    .map((_, index) => index)
    .filter((index) => (index - Math.floor((step - 1) / 2)) % step === 0);
  return (
    <ChartFrame
      label={label}
      spoken={[chartTextOf(table, locale), ...notes].join("; ")}
      legend={(props.showLegend ?? (series.length > 1 || compared.length > 0)) ? series : []}
      palette={palette}
      onToggle={toggle}
      hiddenKeys={hidden}
      showComparison={compared.length > 0}
      className={props.className}
      readout={
        row && props.showTooltip !== false ? (
          <ChartReadout
            title={category(row[xKey])}
            items={[
              ...shown.map(({ item, index }) => ({
                label: item.label,
                value: typeof row[item.key] === "number" ? value(row[item.key] as number) : "",
                color: paint.series[index] ?? "",
              })),
              ...compared.map((twin) => ({
                label: twin.label,
                value: typeof row[twin.key] === "number" ? value(row[twin.key] as number) : "",
                color: alphaOf(paint.series[twin.index] ?? "", 0.6),
              })),
            ]}
            indicator={kind === "line" ? "line" : "dot"}
          />
        ) : null
      }
    >
      <View style={{ height }}>
        <Chart
          data={rows}
          xKey={xKey}
          yKeys={keys}
          {...(props.showTooltip === false ? {} : { chartPressState: state })}
          padding={{ top: 8, bottom: 4 }}
          domainPadding={
            kind === "bar" ? { left: 36, right: 36, top: 8 } : { left: 16, right: 16, top: 8 }
          }
          {...(kind === "line" && referenceTop === 0
            ? {}
            : {
                domain: {
                  y: [
                    kind === "line" ? Math.min(0, ...values) : 0,
                    Math.max(isStacked ? stackTop : 0, referenceTop, ...values),
                  ],
                },
              })}
          frame={{ lineWidth: 0 }}
          xAxis={{
            labelRenderer: labels,
            formatXLabel: category,
            lineWidth: 0,
            labelColor: paint.muted,
            tickValues: ticks,
            // Victory thins tick values down to its tick count, five by default.
            tickCount: ticks.length,
          }}
          yAxis={[
            {
              axisSide: isRtl ? "right" : "left",
              ...(props.showValueAxis
                ? {
                    labelRenderer: labels,
                    formatYLabel: (figure: unknown) =>
                      typeof figure !== "number"
                        ? String(figure)
                        : isShare
                          ? formatChartNumber(figure, locale, { style: "percent" })
                          : formatChartNumber(figure, locale, {
                              notation: "compact",
                              ...valueFormat,
                            }),
                  }
                : {}),
              labelColor: paint.muted,
              lineColor: paint.grid,
              lineWidth: props.showGrid === false ? 0 : 1,
              tickCount: 4,
            },
          ]}
        >
          {({ points, chartBounds, yScale }) => {
            const sets = shown.map(({ item }) => points[item.key] ?? []);
            const colors = shown.map(({ index }) => paint.series[index] ?? "");
            const shownKeys = shown.map(({ item }) => item.key);
            // Target lines and threshold bands, behind the series, labelled at the reading end.
            const references = (props.references ?? []).map((reference, index) => {
              const color =
                reference.color === undefined || reference.color === "muted"
                  ? paint.muted
                  : (paint.series[series.length + index] ?? paint.muted);
              const top = yScale(reference.value ?? reference.to ?? 0);
              const bottom = yScale(reference.value ?? reference.from ?? 0);
              const width = 120;
              const x = isRtl ? chartBounds.left + 4 : chartBounds.right - width - 4;
              return (
                // oxlint-disable-next-line react/no-array-index-key -- reference lines carry no id and may share a value; the list is fixed per render
                <Group key={`reference-${index}`}>
                  {reference.value === undefined ? (
                    <Rect
                      x={chartBounds.left}
                      y={Math.min(top, bottom)}
                      width={chartBounds.right - chartBounds.left}
                      height={Math.abs(bottom - top)}
                      color={alphaOf(color, 0.08)}
                    />
                  ) : (
                    <SkiaLine
                      p1={vec(chartBounds.left, top)}
                      p2={vec(chartBounds.right, top)}
                      color={color}
                      strokeWidth={1.5}
                    >
                      <DashPathEffect intervals={[4, 4]} />
                    </SkiaLine>
                  )}
                  {reference.label
                    ? labels.render({
                        text: reference.label,
                        x,
                        y: Math.min(top, bottom) + 2,
                        width,
                        color,
                      } as never)
                    : null}
                </Group>
              );
            });
            const twins = compared.map((twin) => (
              <Line
                key={`previous-${twin.key}`}
                points={points[twin.key] ?? []}
                color={alphaOf(paint.series[twin.index] ?? "", 0.7)}
                strokeWidth={1.5}
                curveType={curve}
              >
                <DashPathEffect intervals={[5, 4]} />
              </Line>
            ));
            const cursor = !isActive ? null : kind === "bar" ? (
              <CursorBlock
                state={state}
                bounds={chartBounds}
                band={(chartBounds.right - chartBounds.left) / Math.max(1, rows.length)}
                color={paint.cursorBlock}
              />
            ) : (
              <>
                <Cursor state={state} bounds={chartBounds} color={paint.muted} />
                {shownKeys.map((key, index) => (
                  <ActiveDot
                    key={key}
                    state={state}
                    seriesKey={key}
                    color={colors[index] ?? ""}
                    ring={paint.surface}
                  />
                ))}
              </>
            );
            if (kind === "bar") {
              if (isStacked)
                return (
                  <>
                    {references}
                    {cursor}
                    <StackedBar
                      points={sets}
                      chartBounds={chartBounds}
                      colors={colors}
                      innerPadding={0.55}
                      {...(animate ? { animate } : {})}
                      barOptions={({ isTop }) => ({
                        roundedCorners: {
                          // Only a stack's outer end is rounded; its base stands square on the axis.
                          topLeft: isTop ? 4 : 0,
                          topRight: isTop ? 4 : 0,
                        },
                      })}
                    />
                  </>
                );
              if (sets.length === 1 && compared.length === 0)
                return (
                  <>
                    {references}
                    {cursor}
                    <Bar
                      points={sets[0] ?? []}
                      chartBounds={chartBounds}
                      color={colors[0] ?? ""}
                      innerPadding={0.55}
                      roundedCorners={{ topLeft: 4, topRight: 4 }}
                      {...(animate ? { animate } : {})}
                    />
                  </>
                );
              // A previous-period bar stands faded just before its series' bar in each group.
              const columns = shown.flatMap(({ item, index }) => {
                const twin = compared.find((entry) => entry.series.key === item.key);
                const color = paint.series[index] ?? "";
                return [
                  ...(twin ? [{ key: twin.key, color: alphaOf(color, 0.35) }] : []),
                  { key: item.key, color },
                ];
              });
              return (
                <>
                  {references}
                  {cursor}
                  <BarGroup
                    chartBounds={chartBounds}
                    betweenGroupPadding={0.3}
                    withinGroupPadding={0.1}
                    roundedCorners={{ topLeft: 4, topRight: 4 }}
                  >
                    {columns.map((column) => (
                      <BarGroup.Bar
                        key={column.key}
                        points={points[column.key] ?? []}
                        color={column.color}
                        {...(animate ? { animate } : {})}
                      />
                    ))}
                  </BarGroup>
                </>
              );
            }
            if (kind === "area" && isStacked)
              return (
                <>
                  {references}
                  <StackedArea
                    points={sets}
                    y0={chartBounds.bottom}
                    curveType={curve}
                    colors={colors}
                    {...(animate ? { animate } : {})}
                    // oxlint-disable-next-line react/no-unstable-nested-components -- an options callback the area calls for each series' props, not a component type
                    areaOptions={({ rowIndex, lowestY, highestY }) => ({
                      children: (
                        <LinearGradient
                          start={vec(0, highestY)}
                          end={vec(0, lowestY)}
                          colors={[
                            faded(colors[rowIndex] ?? "", 0.7),
                            faded(colors[rowIndex] ?? "", 0.25),
                          ]}
                        />
                      ),
                    })}
                  />
                  {twins}
                  {cursor}
                </>
              );
            return (
              <>
                {references}
                {twins}
                {sets.map((set, index) => {
                  const color = colors[index] ?? "";
                  return (
                    <Fragment key={shownKeys[index]}>
                      {kind === "area" ? (
                        <Area
                          points={set}
                          y0={chartBounds.bottom}
                          curveType={curve}
                          {...(animate ? { animate } : {})}
                        >
                          <LinearGradient
                            start={vec(0, chartBounds.top)}
                            end={vec(0, chartBounds.bottom)}
                            colors={[faded(color, 0.35), faded(color, 0)]}
                          />
                        </Area>
                      ) : null}
                      <Line
                        points={set}
                        color={color}
                        strokeWidth={2}
                        curveType={curve}
                        {...(animate ? { animate } : {})}
                      />
                      {props.showDots ? <Scatter points={set} radius={3} color={color} /> : null}
                    </Fragment>
                  );
                })}
                {cursor}
              </>
            );
          }}
        </Chart>
      </View>
    </ChartFrame>
  );
}

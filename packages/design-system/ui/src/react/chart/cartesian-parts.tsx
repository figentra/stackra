/**
 * Stackra file contract:
 * Purpose: `cartesianParts`, the grid, axes and tooltip the web area, bar and line charts share, in the theme's paints
 *          and the reader's direction: the category axis runs right to left in Arabic and the value axis sits on the
 *          reading start; horizontal bars swap the two axes.
 * Boundary: returns Recharts elements for the chart's children; draws no series. Adds a second value axis at the
 *           reading end for `secondaryKeys` (series join it through `axisOf`), a log value scale, and annotations as
 *           dashed guides through their category.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); ADR 0060 (right-to-left); STA-1371.
 */
import type { ReactElement } from "react";
import {
  Brush,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { CartesianChartContractProps } from "#contracts/types/cartesian-chart-contract-props.type";
import { formatChartCategory } from "#core/functions/format-chart-category.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { logTicksOf } from "#core/functions/log-ticks-of.function";
import { CHART_PAINT } from "#react/chart/chart-paint.constant";
import { paintOf } from "#react/chart/paint-of.function";
import { ChartTooltip } from "#react/chart-tooltip/chart-tooltip";
import { SECONDARY_AXIS } from "#react/chart/secondary-axis.constant";

/** What the shared parts read. */
interface CartesianPartsOptions extends Pick<
  CartesianChartContractProps,
  | "xKey"
  | "xFormat"
  | "valueFormat"
  | "showGrid"
  | "showValueAxis"
  | "showTooltip"
  | "references"
  | "showBrush"
  | "isNormalized"
  | "stacked"
  | "annotations"
  | "secondaryKeys"
  | "valueScale"
> {
  /** The rows and series a log axis spans; a chart with no log axis may leave them out. */
  readonly data?: CartesianChartContractProps["data"];
  readonly series?: CartesianChartContractProps["series"];
  readonly locale: string;
  readonly isRtl: boolean;
  /** Bars lie along the category axis, which then runs down the side. */
  readonly isHorizontal?: boolean;
  /** A band behind the pointed bars instead of a line through the pointed points. */
  readonly isBandCursor?: boolean;
  /** The brush's accessible name, in the reader's language. */
  readonly brushLabel?: string;
  /** The tooltip's indicator. */
  readonly indicator?: "dot" | "line";
}

/** The grid, axes and tooltip of a cartesian chart. */
export function cartesianParts(options: CartesianPartsOptions): ReactElement[] {
  const { xKey, xFormat, valueFormat, locale, isRtl, isHorizontal = false } = options;
  const category = (value: unknown) => formatChartCategory(value, locale, xFormat);
  const value = (figure: number) => formatChartNumber(figure, locale, valueFormat);
  const isShare = options.isNormalized === true && options.stacked === true;
  const tick = (figure: unknown) =>
    typeof figure !== "number"
      ? String(figure)
      : isShare
        ? formatChartNumber(figure, locale, { style: "percent" })
        : formatChartNumber(figure, locale, { notation: "compact", ...valueFormat });
  const categoryAxis = {
    dataKey: xKey,
    type: "category" as const,
    tickLine: false,
    axisLine: false,
    tickMargin: 8,
    minTickGap: 24,
    tick: CHART_PAINT.tick,
    tickFormatter: category,
  };
  const valueAxis = {
    type: "number" as const,
    tickLine: false,
    axisLine: false,
    tickMargin: 8,
    tick: CHART_PAINT.tick,
    tickFormatter: tick,
    hide: !options.showValueAxis,
  };
  // A log scale has no zero: it runs from the power of ten below the axis' smallest value to the one above its
  // largest, with a tick at each; Recharts leaves values of zero or below off it.
  const secondaryKeys = isHorizontal ? [] : (options.secondaryKeys ?? []);
  const scaleOf = (isSecondary: boolean) => {
    if (options.valueScale !== "log") return {};
    const keys = (options.series ?? [])
      .map((item) => item.key)
      .filter((key) => secondaryKeys.includes(key) === isSecondary);
    const ticks = logTicksOf((options.data ?? []).flatMap((row) => keys.map((key) => row[key])));
    return {
      scale: "log" as const,
      domain: [ticks[0] ?? 1, ticks.at(-1) ?? 10] as [number, number],
      ticks,
      allowDataOverflow: true,
    };
  };
  const side = isRtl ? ("right" as const) : ("left" as const);
  // Recharts anchors a right-hand axis' ticks at "start", which a right-to-left page reads as the text's right edge,
  // so the labels would run into the plot; "end" there puts their left edge on the axis.
  const sideTick = isRtl ? { ...CHART_PAINT.tick, textAnchor: "end" as const } : CHART_PAINT.tick;
  const parts: ReactElement[] = [];
  if (options.showGrid !== false)
    parts.push(<CartesianGrid key="grid" {...CHART_PAINT.grid} vertical={false} />);
  parts.push(
    isHorizontal ? (
      <XAxis key="x" {...valueAxis} {...scaleOf(false)} reversed={isRtl} />
    ) : (
      <XAxis key="x" {...categoryAxis} reversed={isRtl} />
    ),
    isHorizontal ? (
      <YAxis key="y" {...categoryAxis} tick={sideTick} orientation={side} width="auto" />
    ) : (
      <YAxis
        key="y"
        {...valueAxis}
        {...scaleOf(false)}
        tick={sideTick}
        orientation={side}
        width="auto"
      />
    ),
  );
  // The second value axis sits at the reading end, so its labels anchor the other way round.
  if (secondaryKeys.length > 0)
    parts.push(
      <YAxis
        key="y-secondary"
        yAxisId={SECONDARY_AXIS}
        {...valueAxis}
        {...scaleOf(true)}
        tick={isRtl ? CHART_PAINT.tick : { ...CHART_PAINT.tick, textAnchor: "start" as const }}
        orientation={isRtl ? "left" : "right"}
        width="auto"
      />,
    );
  // References sit behind the series: a band is a faint fill, a line is dashed, each labelled at the reading end.
  const axis = isHorizontal ? "x" : "y";
  (options.references ?? []).forEach((reference) => {
    const color = paintOf(reference.color ?? "muted");
    const label = reference.label
      ? {
          value: reference.label,
          position: isHorizontal
            ? ("insideTop" as const)
            : isRtl
              ? ("insideTopLeft" as const)
              : ("insideTopRight" as const),
          fill: color,
          fontSize: 10,
          // An Arabic page sets the SVG's direction to rtl, where "start" is the text's right edge: anchored at the
          // plot's left, the label would run out of it, so it is anchored by its left edge ("end") instead.
          ...(isRtl && !isHorizontal ? { textAnchor: "end" as const } : {}),
        }
      : undefined;
    if (reference.value !== undefined)
      parts.push(
        <ReferenceLine
          key={`line:${reference.value}`}
          {...{ [axis]: reference.value }}
          stroke={color}
          strokeDasharray="4 4"
          strokeWidth={1.5}
          ifOverflow="extendDomain"
          {...(label ? { label } : {})}
        />,
      );
    else if (reference.from !== undefined && reference.to !== undefined)
      parts.push(
        <ReferenceArea
          key={`area:${reference.from}:${reference.to}`}
          {...{ [`${axis}1`]: reference.from, [`${axis}2`]: reference.to }}
          fill={color}
          fillOpacity={0.08}
          stroke="none"
          ifOverflow="extendDomain"
          {...(label ? { label } : {})}
        />,
      );
  });
  // Annotations: a dashed guide through a category, its label at the top on the reading-end side of the guide.
  (options.annotations ?? []).forEach((annotation) => {
    const color = paintOf(annotation.color ?? "muted");
    parts.push(
      <ReferenceLine
        key={`note:${annotation.at}`}
        {...{ [isHorizontal ? "y" : "x"]: annotation.at }}
        stroke={color}
        strokeDasharray="3 3"
        strokeWidth={1}
        label={{
          value: annotation.label,
          position: isHorizontal ? ("insideTopRight" as const) : ("insideTop" as const),
          fill: color,
          fontSize: 10,
        }}
      />,
    );
  });
  if (options.showBrush && !isHorizontal)
    parts.push(
      <Brush
        key="brush"
        dataKey={xKey}
        height={24}
        travellerWidth={8}
        stroke={paintOf("border")}
        fill="transparent"
        tickFormatter={category}
        {...(options.brushLabel ? { ariaLabel: options.brushLabel } : {})}
        traveller={(handle: { x: number; y: number; width: number; height: number }) => (
          <rect
            x={handle.x + 1}
            y={handle.y + 2}
            width={Math.max(handle.width - 2, 4)}
            height={handle.height - 4}
            rx={3}
            fill={paintOf("muted")}
          />
        )}
      />,
    );
  if (options.showTooltip !== false)
    parts.push(
      <Tooltip
        key="tooltip"
        cursor={options.isBandCursor ? CHART_PAINT.cursorBand : CHART_PAINT.cursorLine}
        content={(props) => (
          <ChartTooltip
            active={props.active}
            payload={props.payload}
            label={props.label}
            formatLabel={category}
            formatValue={value}
            indicator={options.indicator}
          />
        )}
      />,
    );
  return parts;
}

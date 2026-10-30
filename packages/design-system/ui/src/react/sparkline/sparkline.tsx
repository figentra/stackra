/**
 * Stackra file contract:
 * Purpose: the web `Sparkline` on Recharts: a word-sized line, area or bar trend with no axes, legend or tooltip, for
 *          a table cell or a stat tile; an `img` whose name is `label` followed by its values in the locale.
 * Boundary: no style of its own; it fills its container's width. It follows the reading direction, oldest value at
 *           the reading start. Recharts animates only without `prefers-reduced-motion`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";
import { Area, AreaChart, Bar, BarChart, Line, LineChart, XAxis, YAxis } from "recharts";

import { isArabic } from "#core/functions/is-arabic.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { paintOf } from "#react/chart/paint-of.function";
import { useChartLocale } from "#react/chart/use-chart-locale";
import type { SparklineProps } from "#react/sparkline/sparkline.props";

/** A tiny trend. */
export function Sparkline({
  data,
  label,
  kind = "line",
  color = "accent",
  valueFormat,
  height = 32,
  className,
}: SparklineProps): ReactElement {
  const { locale, isRtl } = useChartLocale();
  const spoken = data
    .map((figure) => formatChartNumber(figure, locale, valueFormat))
    .join(isArabic(locale) ? "، " : ", ");
  const rows = data.map((figure, index) => ({ index, figure }));
  const paint = paintOf(color);
  const common = {
    data: rows,
    responsive: true,
    style: { width: "100%", height },
    margin: { top: 2, bottom: 2, left: 2, right: 2 },
    accessibilityLayer: false,
    role: "img",
    "aria-label": `${label}: ${spoken}`,
  };
  const axes = [
    <XAxis key="x" dataKey="index" hide reversed={isRtl} />,
    <YAxis key="y" hide domain={["dataMin", "dataMax"]} />,
  ];
  return (
    <div data-slot="sparkline" className={cn("w-full min-w-0", className)}>
      {kind === "bar" ? (
        <BarChart {...common} barCategoryGap={1}>
          {axes[0]}
          <YAxis hide />
          <Bar dataKey="figure" fill={paint} radius={1} />
        </BarChart>
      ) : kind === "area" ? (
        <AreaChart {...common}>
          {axes}
          <Area
            dataKey="figure"
            type="monotone"
            stroke={paint}
            strokeWidth={1.5}
            fill={paint}
            fillOpacity={0.15}
          />
        </AreaChart>
      ) : (
        <LineChart {...common}>
          {axes}
          <Line dataKey="figure" type="monotone" stroke={paint} strokeWidth={1.5} dot={false} />
        </LineChart>
      )}
    </div>
  );
}

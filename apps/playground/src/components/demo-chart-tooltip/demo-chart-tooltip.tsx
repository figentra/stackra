/**
 * Stackra file contract:
 * Purpose: the tooltip card the chart pages of the Pro group show for a hovered point: the point's label as a header,
 *          then one row per series with its colour swatch, name and value, drawn with `@stackra-pro/ui`'s ChartTooltip.
 * Boundary: presentation only; a recharts chart passes it as the `content` of its Tooltip, and it draws nothing while
 *          no point is active. Values are isolated left to right (`<bdi>`) so a right-to-left page keeps them readable.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import { ChartTooltip } from "@stackra-pro/ui/react";
import type { DemoChartTooltipProps } from "./demo-chart-tooltip.props";

/** The tooltip card of a hovered point. */
export function DemoChartTooltip({ active, label, payload, format }: DemoChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <ChartTooltip>
      {label === undefined ? null : <ChartTooltip.Header>{label}</ChartTooltip.Header>}
      {payload.map((entry) => (
        <ChartTooltip.Item key={String(entry.dataKey)}>
          <ChartTooltip.Indicator color={entry.color ?? "currentColor"} />
          <ChartTooltip.Label>{entry.name}</ChartTooltip.Label>
          <ChartTooltip.Value>
            <bdi>
              {format ? format(Number(entry.value)) : Number(entry.value).toLocaleString("en-US")}
            </bdi>
          </ChartTooltip.Value>
        </ChartTooltip.Item>
      ))}
    </ChartTooltip>
  );
}

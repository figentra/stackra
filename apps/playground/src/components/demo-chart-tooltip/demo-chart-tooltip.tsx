/**
 * Stackra file contract:
 * Purpose: the tooltip card the chart pages of the Pro group show for a hovered point: the point's label as a header,
 *          then one row per series with its colour swatch, name and value, drawn with `@stackra/ui-pro`'s ChartTooltip.
 * Boundary: presentation only; a recharts chart passes it as the `content` of its Tooltip, and it draws nothing while
 *          no point is active. Values are isolated left to right (`<bdi>`) so a right-to-left page keeps them readable.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import { ChartTooltip } from "@stackra/ui-pro/react";

/** One row of a tooltip's payload, as far as the card reads it. */
export interface DemoChartTooltipEntry {
  /** The data key of the series; the row's key. */
  readonly dataKey?: unknown;
  /** The colour of the series; a CSS colour. */
  readonly color?: string | undefined;
  /** The name of the series. */
  readonly name?: string | number | undefined;
  /** The value at the point. */
  readonly value?: unknown;
}

/** Props of {@link DemoChartTooltip}; recharts passes them to a tooltip's `content`. */
export interface DemoChartTooltipProps {
  /** Whether a point is hovered or focused. */
  readonly active?: boolean | undefined;
  /** The label of the point, the header. */
  readonly label?: string | number | undefined;
  /** One entry per series at the point. */
  readonly payload?: readonly DemoChartTooltipEntry[] | undefined;
  /** How a value reads; locale numbers when left out. */
  readonly format?: ((value: number) => string) | undefined;
}

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

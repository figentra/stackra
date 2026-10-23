/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `ChartTooltip` (@stackra/ui-pro): the card that follows a press
 *          on a bar and line chart with a header and one row per series, above or below the pressed point.
 * Boundary: presentation and local demo state only; the tooltip is @stackra/ui-pro's, the press state is victory-native's.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import {
  ChartCrosshair,
  ChartIndicator,
  ChartTooltip,
  ComposedChart,
} from "@stackra/ui-pro/native";
import { Typography, useThemeColor } from "heroui-native";
import { useChartTooltipAnchor } from "heroui-native-pro/chart-tooltip";
import { useState } from "react";
import { type ChartBounds, useChartPressState } from "victory-native";

import { ChoiceGroup } from "#src/components/ui/choice-group";
import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  tooltip: {
    title: "Tooltip on press",
    description:
      "Press and hold the chart: the card follows the point, stays inside the plot and reads out each series.",
    hint: "Press and hold, then drag, to read the values of a month. The card is announced as you move.",
    revenue: "Revenue",
    orders: "Orders",
    cardLabel: "Revenue and orders for the selected month",
  },
  placement: {
    label: "Placement",
    top: "Top",
    bottom: "Bottom",
  },
} as const;

type Placement = "top" | "bottom";

const SALES = [
  { month: "Jan", revenue: 4200, orders: 31 },
  { month: "Feb", revenue: 5800, orders: 44 },
  { month: "Mar", revenue: 4900, orders: 38 },
  { month: "Apr", revenue: 7200, orders: 56 },
  { month: "May", revenue: 6100, orders: 49 },
  { month: "Jun", revenue: 8400, orders: 67 },
];

/** The tooltip card: reads the pressed row from the anchor, so it must sit inside `ChartTooltip.Anchor`. */
function SalesTooltip({ placement }: { placement: Placement }) {
  const { activeIndex } = useChartTooltipAnchor();
  const [accent, success] = useThemeColor(["accent", "success"]);
  const row = activeIndex == null ? null : SALES[activeIndex];

  return (
    <ChartTooltip placement={placement} accessibilityLabel={STRINGS.tooltip.cardLabel}>
      <ChartTooltip.Header>{row?.month ?? ""}</ChartTooltip.Header>
      <ChartTooltip.Item>
        <ChartTooltip.Indicator color={accent} variant="dot" />
        <ChartTooltip.Label>{STRINGS.tooltip.revenue}</ChartTooltip.Label>
        <ChartTooltip.Value>{row ? row.revenue.toLocaleString() : ""}</ChartTooltip.Value>
      </ChartTooltip.Item>
      <ChartTooltip.Item>
        <ChartTooltip.Indicator color={success} variant="line" />
        <ChartTooltip.Label>{STRINGS.tooltip.orders}</ChartTooltip.Label>
        <ChartTooltip.Value>{row ? row.orders.toLocaleString() : ""}</ChartTooltip.Value>
      </ChartTooltip.Item>
    </ChartTooltip>
  );
}

/** The ChartTooltip page: the tooltip on a chart and a placement switch, in a scrollable screen. */
export function ChartTooltipScreen() {
  const [placement, setPlacement] = useState<Placement>("top");
  const [chartBounds, setChartBounds] = useState<ChartBounds | null>(null);
  const { state, isActive } = useChartPressState({ x: "" as string, y: { revenue: 0, orders: 0 } });

  return (
    <Screen>
      <Section title={STRINGS.tooltip.title} description={STRINGS.tooltip.description}>
        <ChoiceGroup
          label={STRINGS.placement.label}
          choices={[
            { value: "top", label: STRINGS.placement.top },
            { value: "bottom", label: STRINGS.placement.bottom },
          ]}
          value={placement}
          onChange={setPlacement}
        />
        <ChartTooltip.Anchor
          chartBounds={chartBounds}
          isActive={state.isActive}
          matchedIndex={state.matchedIndex}
          x={state.x.position}
          y={state.y.orders.position}
        >
          <ComposedChart
            data={SALES}
            xKey="month"
            yKeys={["revenue", "orders"]}
            chartPressState={state}
            onChartBoundsChange={setChartBounds}
            wrapperClassName="h-[220px]"
          >
            {({ points, chartBounds: bounds }) => (
              <>
                <ComposedChart.Bar points={points.revenue} chartBounds={bounds} />
                <ComposedChart.Line points={points.orders} colorClassName="accent-chart-1" />
                {isActive ? (
                  <>
                    <ChartCrosshair x={state.x.position} top={bounds.top} bottom={bounds.bottom} />
                    <ChartIndicator x={state.x.position} y={state.y.orders.position} />
                  </>
                ) : null}
              </>
            )}
          </ComposedChart>
          <SalesTooltip placement={placement} />
        </ChartTooltip.Anchor>
        <Typography.Paragraph type="body-sm" color="muted">
          {STRINGS.tooltip.hint}
        </Typography.Paragraph>
      </Section>
    </Screen>
  );
}

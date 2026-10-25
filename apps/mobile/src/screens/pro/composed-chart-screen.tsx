/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `ComposedChart` (@stackra-pro/ui): bars with a line on a
 *          second axis, stacked bars with a line, and an area under a line.
 * Boundary: presentation and demo data only; the chart is @stackra-pro/ui's, series colours come from theme tokens.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { ComposedChart } from "@stackra-pro/ui/native";
import { useThemeColor } from "heroui-native";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  dual: {
    title: "Bars and a line on two axes",
    description:
      "Each metric has its own y-axis: revenue on the start side, orders on the end side.",
    summary: "Revenue as bars and order count as a line, both rising over six months.",
  },
  stacked: {
    title: "Stacked bars with a line",
    description: "`StackedBar` for the parts and a `Line` for their share, on separate domains.",
    summary: "Stacked bars of web, app and store orders per day with the app share as a line.",
  },
  area: {
    title: "Area under a line",
    description: "An `Area` filled to the baseline with a `Line` drawn over it for the target.",
    summary: "Sessions as a filled area against a flat target line.",
  },
} as const;

const SALES = [
  { month: "Jan", revenue: 4200, orders: 31 },
  { month: "Feb", revenue: 5800, orders: 44 },
  { month: "Mar", revenue: 4900, orders: 38 },
  { month: "Apr", revenue: 7200, orders: 56 },
  { month: "May", revenue: 6100, orders: 49 },
  { month: "Jun", revenue: 8400, orders: 67 },
];

const DAILY = [
  { day: "Mon", web: 20, app: 14, store: 8, appShare: 33 },
  { day: "Tue", web: 24, app: 18, store: 9, appShare: 35 },
  { day: "Wed", web: 22, app: 21, store: 7, appShare: 42 },
  { day: "Thu", web: 28, app: 25, store: 10, appShare: 40 },
  { day: "Fri", web: 30, app: 30, store: 12, appShare: 42 },
];
const DAILY_MAX_TOTAL = Math.max(...DAILY.map((row) => row.web + row.app + row.store));

const SESSIONS = [
  { month: "Jan", sessions: 320, target: 400 },
  { month: "Feb", sessions: 410, target: 400 },
  { month: "Mar", sessions: 380, target: 400 },
  { month: "Apr", sessions: 520, target: 400 },
  { month: "May", sessions: 470, target: 400 },
  { month: "Jun", sessions: 610, target: 400 },
];

/** The ComposedChart page: one section per combination, in a scrollable screen. */
export function ComposedChartScreen() {
  const [accent, success, warning] = useThemeColor(["accent", "success", "warning"]);

  return (
    <Screen>
      <Section title={STRINGS.dual.title} description={STRINGS.dual.description}>
        <View accessible accessibilityRole="image" accessibilityLabel={STRINGS.dual.summary}>
          <ComposedChart
            data={SALES}
            xKey="month"
            yKeys={["revenue", "orders"]}
            yAxis={[
              { yKeys: ["revenue"], formatYLabel: (value) => `${(value / 1000).toFixed(0)}k` },
              { yKeys: ["orders"], axisSide: "right" },
            ]}
            wrapperClassName="h-52"
          >
            {({ points, chartBounds }) => (
              <>
                <ComposedChart.Bar
                  points={points.revenue}
                  chartBounds={chartBounds}
                  colorClassName="accent-chart-3"
                  barWidth={16}
                />
                <ComposedChart.Line
                  points={points.orders}
                  colorClassName="accent-chart-1"
                  curveType="monotoneX"
                />
              </>
            )}
          </ComposedChart>
        </View>
      </Section>

      <Section title={STRINGS.stacked.title} description={STRINGS.stacked.description}>
        <View accessible accessibilityRole="image" accessibilityLabel={STRINGS.stacked.summary}>
          <ComposedChart
            data={DAILY}
            xKey="day"
            yKeys={["web", "app", "store", "appShare"]}
            yAxis={[
              {
                yKeys: ["web", "app", "store"],
                domain: [0, Math.ceil(DAILY_MAX_TOTAL / 10) * 10],
              },
              { yKeys: ["appShare"], axisSide: "right", domain: [0, 100] },
            ]}
            wrapperClassName="h-56"
          >
            {({ points, chartBounds }) => (
              <>
                <ComposedChart.StackedBar
                  chartBounds={chartBounds}
                  points={[points.web, points.app, points.store]}
                  colors={[accent, success, warning]}
                  barWidth={28}
                />
                <ComposedChart.Line points={points.appShare} curveType="monotoneX" />
              </>
            )}
          </ComposedChart>
        </View>
      </Section>

      <Section title={STRINGS.area.title} description={STRINGS.area.description}>
        <View accessible accessibilityRole="image" accessibilityLabel={STRINGS.area.summary}>
          <ComposedChart
            data={SESSIONS}
            xKey="month"
            yKeys={["sessions", "target"]}
            wrapperClassName="h-52"
          >
            {({ points, chartBounds }) => (
              <>
                <ComposedChart.Area
                  points={points.sessions}
                  y0={chartBounds.bottom}
                  curveType="monotoneX"
                />
                <ComposedChart.Line
                  points={points.target}
                  colorClassName="accent-chart-1"
                  curveType="linear"
                />
              </>
            )}
          </ComposedChart>
        </View>
      </Section>
    </Screen>
  );
}

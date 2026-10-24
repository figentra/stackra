/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `BarChart` (@stackra/ui-pro): single bars with the default
 *          and fully rounded corners, grouped bars and stacked bars.
 * Boundary: presentation and demo data only; the chart is @stackra/ui-pro's, series colours come from theme tokens.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { BarChart } from "@stackra/ui-pro/native";
import { useThemeColor } from "heroui-native";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basic: {
    title: "Single series",
    description: "One bar per category; the default has small rounded top corners.",
    summary: "Bar chart of monthly sales, highest in May at 78.",
  },
  rounded: {
    title: "Bar width and corners",
    description:
      "`barWidth` sets the thickness and `roundedCorners` rounds each corner on its own.",
    summary: "Bar chart of monthly sales with thin, fully rounded bars.",
  },
  grouped: {
    title: "Grouped bars",
    description:
      "`BarGroup` puts one bar per series side by side; each item has its own colour class.",
    summary: "Grouped bar chart of online, retail and direct sales per month.",
  },
  stacked: {
    title: "Stacked bars",
    description: "`StackedBar` stacks the series bottom first; only the top segment is rounded.",
    summary: "Stacked bar chart of starter, pro and enterprise plans per quarter.",
  },
} as const;

const SALES = [
  { month: "Jan", sales: 42 },
  { month: "Feb", sales: 58 },
  { month: "Mar", sales: 49 },
  { month: "Apr", sales: 72 },
  { month: "May", sales: 78 },
  { month: "Jun", sales: 64 },
];

const CHANNELS = [
  { month: "Jan", online: 30, retail: 22, direct: 12 },
  { month: "Feb", online: 38, retail: 24, direct: 15 },
  { month: "Mar", online: 34, retail: 28, direct: 10 },
  { month: "Apr", online: 45, retail: 26, direct: 18 },
];

const PLANS = [
  { quarter: "Q1", starter: 20, pro: 30, enterprise: 10 },
  { quarter: "Q2", starter: 24, pro: 34, enterprise: 14 },
  { quarter: "Q3", starter: 22, pro: 40, enterprise: 18 },
  { quarter: "Q4", starter: 28, pro: 44, enterprise: 22 },
];
const PLANS_MAX_TOTAL = Math.max(...PLANS.map((row) => row.starter + row.pro + row.enterprise));

// Integer ticks keep the labels of a text x-axis aligned with the bars.
const SALES_TICKS = SALES.map((_, index) => index);
const PLANS_TICKS = PLANS.map((_, index) => index);

/** The BarChart page: one section per layout, in a scrollable screen. */
export function BarChartScreen() {
  const [accent, success, warning] = useThemeColor(["accent", "success", "warning"]);

  return (
    <Screen>
      <Section title={STRINGS.basic.title} description={STRINGS.basic.description}>
        <View accessible accessibilityRole="image" accessibilityLabel={STRINGS.basic.summary}>
          <BarChart
            data={SALES}
            xKey="month"
            yKeys={["sales"]}
            xAxis={{ tickValues: SALES_TICKS }}
            wrapperClassName="h-52"
          >
            {({ points, chartBounds }) => (
              <BarChart.Bar points={points.sales} chartBounds={chartBounds} />
            )}
          </BarChart>
        </View>
      </Section>

      <Section title={STRINGS.rounded.title} description={STRINGS.rounded.description}>
        <View accessible accessibilityRole="image" accessibilityLabel={STRINGS.rounded.summary}>
          <BarChart
            data={SALES}
            xKey="month"
            yKeys={["sales"]}
            xAxis={{ tickValues: SALES_TICKS }}
            wrapperClassName="h-52"
          >
            {({ points, chartBounds }) => (
              <BarChart.Bar
                points={points.sales}
                chartBounds={chartBounds}
                barWidth={12}
                roundedCorners={{ topLeft: 12, topRight: 12, bottomLeft: 12, bottomRight: 12 }}
                colorClassName="accent-chart-1"
              />
            )}
          </BarChart>
        </View>
      </Section>

      <Section title={STRINGS.grouped.title} description={STRINGS.grouped.description}>
        <View accessible accessibilityRole="image" accessibilityLabel={STRINGS.grouped.summary}>
          <BarChart
            data={CHANNELS}
            xKey="month"
            yKeys={["online", "retail", "direct"]}
            xAxis={{ tickValues: CHANNELS.map((_, index) => index) }}
            wrapperClassName="h-52"
          >
            {({ points, chartBounds }) => (
              <BarChart.BarGroup chartBounds={chartBounds} barWidth={10}>
                <BarChart.BarGroupItem points={points.online} colorClassName="accent-chart-3" />
                <BarChart.BarGroupItem points={points.retail} colorClassName="accent-chart-2" />
                <BarChart.BarGroupItem points={points.direct} colorClassName="accent-chart-1" />
              </BarChart.BarGroup>
            )}
          </BarChart>
        </View>
      </Section>

      <Section title={STRINGS.stacked.title} description={STRINGS.stacked.description}>
        <View accessible accessibilityRole="image" accessibilityLabel={STRINGS.stacked.summary}>
          <BarChart
            data={PLANS}
            xKey="quarter"
            yKeys={["starter", "pro", "enterprise"]}
            xAxis={{ tickValues: PLANS_TICKS }}
            domain={{ y: [0, Math.ceil(PLANS_MAX_TOTAL / 10) * 10] }}
            wrapperClassName="h-52"
          >
            {({ points, chartBounds }) => (
              <BarChart.StackedBar
                chartBounds={chartBounds}
                points={[points.starter, points.pro, points.enterprise]}
                colors={[accent, success, warning]}
                barWidth={32}
                barOptions={({ isTop }) =>
                  isTop
                    ? {
                        roundedCorners: {
                          topLeft: 10,
                          topRight: 10,
                          bottomLeft: 0,
                          bottomRight: 0,
                        },
                      }
                    : {}
                }
              />
            )}
          </BarChart>
        </View>
      </Section>
    </Screen>
  );
}

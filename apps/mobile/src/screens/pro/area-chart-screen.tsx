/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `AreaChart` (@stackra-pro/ui): a single filled area with a
 *          linear and a monotone curve, stacked areas, and a confidence band with a line over it.
 * Boundary: presentation and demo data only; the chart is @stackra-pro/ui's, series colours come from theme tokens.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { AreaChart, LineChart } from "@stackra-pro/ui/native";
import { useThemeColor } from "heroui-native";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basic: {
    title: "Single area",
    description: "One series filled down to the baseline; the fill takes the accent chart colour.",
    summary: "Area chart of monthly revenue rising from 4,200 in January to 11,500 in December.",
  },
  curves: {
    title: "Curve types",
    description:
      "`curveType` on the area: `linear` draws straight segments, `monotoneX` smooths them.",
    linear: "Area chart of six swinging monthly values, drawn with straight segments.",
    monotone: "The same six values, drawn as a smooth monotone curve.",
  },
  stacked: {
    title: "Stacked areas",
    description: "`StackedArea` takes the series bottom first and one colour per layer.",
    summary: "Stacked area chart of low, medium and high priority tickets per month.",
  },
  band: {
    title: "Range band",
    description:
      "`AreaRange` fills the band between an upper and a lower series; a line shows the average.",
    summary: "Temperature band between the monthly low and high, with the average as a line.",
  },
} as const;

const REVENUE = [
  { month: "Jan", revenue: 4200 },
  { month: "Feb", revenue: 5800 },
  { month: "Mar", revenue: 4900 },
  { month: "Apr", revenue: 7200 },
  { month: "May", revenue: 6100 },
  { month: "Jun", revenue: 8400 },
  { month: "Jul", revenue: 7800 },
  { month: "Aug", revenue: 9200 },
  { month: "Sep", revenue: 8600 },
  { month: "Oct", revenue: 10200 },
  { month: "Nov", revenue: 9800 },
  { month: "Dec", revenue: 11500 },
];

// Few points with big swings, so the straight segments and the smoothed curve differ at a glance.
const SWINGS = [
  { month: "Jan", revenue: 2000 },
  { month: "Feb", revenue: 9000 },
  { month: "Mar", revenue: 3000 },
  { month: "Apr", revenue: 10000 },
  { month: "May", revenue: 4000 },
  { month: "Jun", revenue: 11000 },
];

const TICKETS = [
  { month: "Jan", low: 20, med: 30, high: 15 },
  { month: "Feb", low: 25, med: 28, high: 20 },
  { month: "Mar", low: 30, med: 35, high: 18 },
  { month: "Apr", low: 28, med: 40, high: 25 },
  { month: "May", low: 35, med: 38, high: 30 },
  { month: "Jun", low: 40, med: 45, high: 28 },
];
const TICKETS_MAX_TOTAL = Math.max(...TICKETS.map((row) => row.low + row.med + row.high));

const TEMPERATURE = [
  { month: "Jan", low: 4, avg: 9, high: 14 },
  { month: "Feb", low: 5, avg: 10, high: 16 },
  { month: "Mar", low: 8, avg: 14, high: 20 },
  { month: "Apr", low: 11, avg: 18, high: 25 },
  { month: "May", low: 15, avg: 22, high: 29 },
  { month: "Jun", low: 19, avg: 26, high: 33 },
];

/** The AreaChart page: one section per layout, in a scrollable screen. */
export function AreaChartScreen() {
  const [accent, success, warning] = useThemeColor(["accent", "success", "warning"]);

  return (
    <Screen>
      <Section title={STRINGS.basic.title} description={STRINGS.basic.description}>
        <View accessible accessibilityRole="image" accessibilityLabel={STRINGS.basic.summary}>
          <AreaChart data={REVENUE} xKey="month" yKeys={["revenue"]} wrapperClassName="h-48">
            {({ points, chartBounds }) => (
              <AreaChart.Area points={points.revenue} y0={chartBounds.bottom} />
            )}
          </AreaChart>
        </View>
      </Section>

      <Section title={STRINGS.curves.title} description={STRINGS.curves.description}>
        <View accessible accessibilityRole="image" accessibilityLabel={STRINGS.curves.linear}>
          <AreaChart data={SWINGS} xKey="month" yKeys={["revenue"]} wrapperClassName="h-40">
            {({ points, chartBounds }) => (
              <AreaChart.Area points={points.revenue} y0={chartBounds.bottom} curveType="linear" />
            )}
          </AreaChart>
        </View>
        <View accessible accessibilityRole="image" accessibilityLabel={STRINGS.curves.monotone}>
          <AreaChart data={SWINGS} xKey="month" yKeys={["revenue"]} wrapperClassName="h-40">
            {({ points, chartBounds }) => (
              <AreaChart.Area
                points={points.revenue}
                y0={chartBounds.bottom}
                curveType="monotoneX"
              />
            )}
          </AreaChart>
        </View>
      </Section>

      <Section title={STRINGS.stacked.title} description={STRINGS.stacked.description}>
        <View accessible accessibilityRole="image" accessibilityLabel={STRINGS.stacked.summary}>
          <AreaChart
            data={TICKETS}
            xKey="month"
            yKeys={["low", "med", "high"]}
            domain={{ y: [0, Math.ceil(TICKETS_MAX_TOTAL / 10) * 10] }}
            wrapperClassName="h-52"
          >
            {({ points, chartBounds }) => (
              <AreaChart.StackedArea
                points={[points.low, points.med, points.high]}
                y0={chartBounds.bottom}
                colors={[accent, success, warning]}
                curveType="natural"
              />
            )}
          </AreaChart>
        </View>
      </Section>

      <Section title={STRINGS.band.title} description={STRINGS.band.description}>
        <View accessible accessibilityRole="image" accessibilityLabel={STRINGS.band.summary}>
          <AreaChart
            data={TEMPERATURE}
            xKey="month"
            yKeys={["low", "avg", "high"]}
            wrapperClassName="h-52"
          >
            {({ points }) => (
              <>
                <AreaChart.AreaRange
                  upperPoints={points.high}
                  lowerPoints={points.low}
                  color={accent}
                  opacity={0.2}
                  curveType="natural"
                />
                <LineChart.Line points={points.avg} curveType="natural" strokeWidth={2} />
              </>
            )}
          </AreaChart>
        </View>
      </Section>
    </Screen>
  );
}

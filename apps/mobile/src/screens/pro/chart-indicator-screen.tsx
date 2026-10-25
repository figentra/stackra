/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `ChartIndicator` (@stackra-pro/ui): the dot that follows a
 *          press on a line chart, at its default size, enlarged, and in theme colours.
 * Boundary: presentation and demo data only; the indicator is @stackra-pro/ui's, the press state is victory-native's.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { ChartIndicator, LineChart } from "@stackra-pro/ui/native";
import { useThemeColor } from "heroui-native";
import { View } from "react-native";
import { useChartPressState } from "victory-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basic: {
    title: "Default indicator",
    description: "Press and hold the chart: the dot follows your finger along the line.",
    summary: "Line chart of monthly revenue; pressing it moves a marker along the line.",
    hint: "Press and hold, then drag, to move the marker.",
  },
  radius: {
    title: "Radius",
    description: "`innerRadius` and `outerRadius` size the dot and its halo.",
    summary: "Line chart of monthly revenue with a large marker that follows a press.",
    hint: "Press and hold, then drag, to move the marker.",
  },
  colors: {
    title: "Colours",
    description: "`innerColor` and `outerColor` take resolved theme colours.",
    summary: "Line chart of monthly revenue with a success-coloured marker that follows a press.",
    hint: "Press and hold, then drag, to move the marker.",
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

const INITIAL_PRESS = { x: "" as string, y: { revenue: 0 } };

/** The ChartIndicator page: one section per style, in a scrollable screen. */
export function ChartIndicatorScreen() {
  const [success, background] = useThemeColor(["success", "background"]);
  const basic = useChartPressState(INITIAL_PRESS);
  const radius = useChartPressState(INITIAL_PRESS);
  const colors = useChartPressState(INITIAL_PRESS);

  return (
    <Screen>
      <Section title={STRINGS.basic.title} description={STRINGS.basic.description}>
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={STRINGS.basic.summary}
          accessibilityHint={STRINGS.basic.hint}
        >
          <LineChart
            data={REVENUE}
            xKey="month"
            yKeys={["revenue"]}
            chartPressState={basic.state}
            wrapperClassName="h-48"
          >
            {({ points }) => (
              <>
                <LineChart.Line points={points.revenue} curveType="monotoneX" />
                {basic.isActive ? (
                  <ChartIndicator x={basic.state.x.position} y={basic.state.y.revenue.position} />
                ) : null}
              </>
            )}
          </LineChart>
        </View>
      </Section>

      <Section title={STRINGS.radius.title} description={STRINGS.radius.description}>
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={STRINGS.radius.summary}
          accessibilityHint={STRINGS.radius.hint}
        >
          <LineChart
            data={REVENUE}
            xKey="month"
            yKeys={["revenue"]}
            chartPressState={radius.state}
            wrapperClassName="h-48"
          >
            {({ points }) => (
              <>
                <LineChart.Line points={points.revenue} curveType="monotoneX" />
                {radius.isActive ? (
                  <ChartIndicator
                    x={radius.state.x.position}
                    y={radius.state.y.revenue.position}
                    innerRadius={6}
                    outerRadius={10}
                  />
                ) : null}
              </>
            )}
          </LineChart>
        </View>
      </Section>

      <Section title={STRINGS.colors.title} description={STRINGS.colors.description}>
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={STRINGS.colors.summary}
          accessibilityHint={STRINGS.colors.hint}
        >
          <LineChart
            data={REVENUE}
            xKey="month"
            yKeys={["revenue"]}
            chartPressState={colors.state}
            wrapperClassName="h-48"
          >
            {({ points }) => (
              <>
                <LineChart.Line points={points.revenue} curveType="monotoneX" />
                {colors.isActive ? (
                  <ChartIndicator
                    x={colors.state.x.position}
                    y={colors.state.y.revenue.position}
                    innerColor={success}
                    outerColor={background}
                  />
                ) : null}
              </>
            )}
          </LineChart>
        </View>
      </Section>
    </Screen>
  );
}

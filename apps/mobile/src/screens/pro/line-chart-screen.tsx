/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `LineChart` (@stackra-pro/ui): a single line, several series,
 *          the linear and natural curves, and a draw-on line that replays on request.
 * Boundary: presentation and local demo state only; the chart is @stackra-pro/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { Button } from "@stackra/ui/native";
import { LineChart } from "@stackra-pro/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basic: {
    title: "Single line",
    description: "One series; the stroke takes the accent chart colour.",
    summary: "Line chart of monthly revenue rising from 4,200 in January to 11,500 in December.",
  },
  series: {
    title: "Several series",
    description: "One `Line` per series, each with its own colour class so the lines tell apart.",
    summary: "Line chart of organic and paid visits per month; paid grows faster.",
  },
  curves: {
    title: "Curve types",
    description: "`curveType`: `linear` draws straight segments, `natural` a smooth spline.",
    linear: "Line chart with straight segments.",
    natural: "Line chart with a smooth natural curve.",
  },
  drawOn: {
    title: "Draw-on animation",
    description: "`AnimatedLine` sweeps the stroke in; changing `resetKey` plays it again.",
    summary: "Line chart of monthly revenue that draws itself from left to right.",
    replay: "Replay the animation",
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

const TRAFFIC = [
  { month: "Jan", organic: 120, paid: 60 },
  { month: "Feb", organic: 140, paid: 90 },
  { month: "Mar", organic: 135, paid: 120 },
  { month: "Apr", organic: 160, paid: 150 },
  { month: "May", organic: 175, paid: 190 },
  { month: "Jun", organic: 190, paid: 230 },
];

/** The LineChart page: one section per layout, in a scrollable screen. */
export function LineChartScreen() {
  const [replayCount, setReplayCount] = useState(0);

  return (
    <Screen>
      <Section title={STRINGS.basic.title} description={STRINGS.basic.description}>
        <View accessible accessibilityRole="image" accessibilityLabel={STRINGS.basic.summary}>
          <LineChart data={REVENUE} xKey="month" yKeys={["revenue"]} wrapperClassName="h-48">
            {({ points }) => <LineChart.Line points={points.revenue} />}
          </LineChart>
        </View>
      </Section>

      <Section title={STRINGS.series.title} description={STRINGS.series.description}>
        <View accessible accessibilityRole="image" accessibilityLabel={STRINGS.series.summary}>
          <LineChart
            data={TRAFFIC}
            xKey="month"
            yKeys={["organic", "paid"]}
            wrapperClassName="h-48"
          >
            {({ points }) => (
              <>
                <LineChart.Line points={points.organic} colorClassName="accent-chart-3" />
                <LineChart.Line points={points.paid} colorClassName="accent-chart-1" />
              </>
            )}
          </LineChart>
        </View>
      </Section>

      <Section title={STRINGS.curves.title} description={STRINGS.curves.description}>
        <View accessible accessibilityRole="image" accessibilityLabel={STRINGS.curves.linear}>
          <LineChart data={REVENUE} xKey="month" yKeys={["revenue"]} wrapperClassName="h-40">
            {({ points }) => <LineChart.Line points={points.revenue} curveType="linear" />}
          </LineChart>
        </View>
        <View accessible accessibilityRole="image" accessibilityLabel={STRINGS.curves.natural}>
          <LineChart data={REVENUE} xKey="month" yKeys={["revenue"]} wrapperClassName="h-40">
            {({ points }) => <LineChart.Line points={points.revenue} curveType="natural" />}
          </LineChart>
        </View>
      </Section>

      <Section title={STRINGS.drawOn.title} description={STRINGS.drawOn.description}>
        <View accessible accessibilityRole="image" accessibilityLabel={STRINGS.drawOn.summary}>
          <LineChart data={REVENUE} xKey="month" yKeys={["revenue"]} wrapperClassName="h-48">
            {({ points }) => (
              <LineChart.AnimatedLine
                points={points.revenue}
                curveType="natural"
                animation={{ type: "timing", duration: 1200 }}
                resetKey={replayCount}
              />
            )}
          </LineChart>
        </View>
        <Button
          size="sm"
          variant="secondary"
          label={STRINGS.drawOn.replay}
          onPress={() => setReplayCount((count) => count + 1)}
        >
          {STRINGS.drawOn.replay}
        </Button>
      </Section>
    </Screen>
  );
}

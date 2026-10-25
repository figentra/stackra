/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `ChartCrosshair` (@stackra-pro/ui): the vertical press guide
 *          in its dashed and solid variants, and with a value pill that follows it.
 * Boundary: presentation and demo data only; the crosshair is @stackra-pro/ui's, the press state is victory-native's.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { ChartCrosshair, ChartIndicator, LineChart } from "@stackra-pro/ui/native";
import { useState } from "react";
import { View } from "react-native";
import { useDerivedValue } from "react-native-reanimated";
import { type ChartBounds, useChartPressState } from "victory-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  variants: {
    title: "Dashed and solid",
    description: "`variant` is `dashed` by default; `solid` draws an unbroken rule.",
    dashed: "Line chart of monthly revenue with a dashed guide that follows a press.",
    solid: "Line chart of monthly revenue with a solid guide that follows a press.",
    hint: "Press and hold, then drag, to move the guide.",
  },
  value: {
    title: "Value pill",
    description:
      "`ChartCrosshair.Value` shows the pressed value in a pill that stays centred on the guide.",
    summary: "Line chart of monthly revenue with a pill showing the pressed value in thousands.",
    hint: "Press and hold, then drag, to move the guide and read the value.",
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

/** The ChartCrosshair page: one section per style, in a scrollable screen. */
export function ChartCrosshairScreen() {
  const dashed = useChartPressState(INITIAL_PRESS);
  const solid = useChartPressState(INITIAL_PRESS);
  const pill = useChartPressState(INITIAL_PRESS);
  const [chartBounds, setChartBounds] = useState<ChartBounds | null>(null);
  const label = useDerivedValue(() => `${(pill.state.y.revenue.value.get() / 1000).toFixed(1)}k`);

  return (
    <Screen>
      <Section title={STRINGS.variants.title} description={STRINGS.variants.description}>
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={STRINGS.variants.dashed}
          accessibilityHint={STRINGS.variants.hint}
        >
          <LineChart
            data={REVENUE}
            xKey="month"
            yKeys={["revenue"]}
            chartPressState={dashed.state}
            wrapperClassName="h-44"
          >
            {({ points, chartBounds: bounds }) => (
              <>
                <LineChart.Line points={points.revenue} />
                {dashed.isActive ? (
                  <ChartCrosshair
                    x={dashed.state.x.position}
                    top={bounds.top}
                    bottom={bounds.bottom}
                  />
                ) : null}
              </>
            )}
          </LineChart>
        </View>
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={STRINGS.variants.solid}
          accessibilityHint={STRINGS.variants.hint}
        >
          <LineChart
            data={REVENUE}
            xKey="month"
            yKeys={["revenue"]}
            chartPressState={solid.state}
            wrapperClassName="h-44"
          >
            {({ points, chartBounds: bounds }) => (
              <>
                <LineChart.Line points={points.revenue} />
                {solid.isActive ? (
                  <ChartCrosshair
                    variant="solid"
                    x={solid.state.x.position}
                    top={bounds.top}
                    bottom={bounds.bottom}
                  />
                ) : null}
              </>
            )}
          </LineChart>
        </View>
      </Section>

      <Section title={STRINGS.value.title} description={STRINGS.value.description}>
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={STRINGS.value.summary}
          accessibilityHint={STRINGS.value.hint}
          className="relative h-52 w-full"
        >
          <ChartCrosshair.Anchor
            chartBounds={chartBounds}
            isActive={pill.state.isActive}
            x={pill.state.x.position}
          >
            <LineChart
              data={REVENUE}
              xKey="month"
              yKeys={["revenue"]}
              chartPressState={pill.state}
              onChartBoundsChange={setChartBounds}
              wrapperClassName="h-full"
            >
              {({ points, chartBounds: bounds }) => (
                <>
                  <LineChart.Line points={points.revenue} />
                  {pill.isActive ? (
                    <>
                      <ChartIndicator x={pill.state.x.position} y={pill.state.y.revenue.position} />
                      <ChartCrosshair
                        x={pill.state.x.position}
                        top={bounds.top}
                        bottom={bounds.bottom}
                      />
                    </>
                  ) : null}
                </>
              )}
            </LineChart>
            <ChartCrosshair.Value className="min-w-20 px-2" value={label} />
          </ChartCrosshair.Anchor>
        </View>
      </Section>
    </Screen>
  );
}

/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `RadialChart` (@stackra-pro/ui): concentric rings, evenly
 *          spaced rings, and a single-ring gauge on a fixed 0 to 100 scale, each with a legend that names the values.
 * Boundary: presentation and demo data only; the chart is @stackra-pro/ui's, ring colours come from theme tokens.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { Text } from "@stackra/ui/native";
import { RadialChart } from "@stackra-pro/ui/native";
import { useThemeColor } from "heroui-native";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  rings: {
    title: "Concentric rings",
    description:
      "One ring per row, the first row innermost; the largest value fills the full sweep.",
    summary: "Radial chart of daily goals: move 72, exercise 45, stand 90.",
  },
  even: {
    title: "Even bands",
    description: '`barGap="auto"` spreads the rings evenly from the inner to the outer radius.',
    summary: "Radial chart of daily goals with evenly spaced rings.",
  },
  gauge: {
    title: "Gauge",
    description: "A single row with `domain={[0, 100]}`: the sweep reads directly as a percentage.",
    summary: "Gauge at 78 percent.",
    label: "Score: 78%",
  },
} as const;

const GOALS = [
  { name: "Move", value: 72 },
  { name: "Exercise", value: 45 },
  { name: "Stand", value: 90 },
] as const;

/** The RadialChart page: one section per layout, in a scrollable screen. */
export function RadialChartScreen() {
  const [accent, success, warning] = useThemeColor(["accent", "success", "warning"]);
  const colors = [accent, success, warning];
  const goals = GOALS.map((goal, index) => ({ ...goal, color: colors[index] ?? accent }));

  return (
    <Screen>
      <Section title={STRINGS.rings.title} description={STRINGS.rings.description}>
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={STRINGS.rings.summary}
          className="items-center"
        >
          <RadialChart
            data={goals}
            labelKey="name"
            valueKey="value"
            colorKey="color"
            wrapperClassName="w-[200px]"
          >
            <RadialChart.Bar background />
          </RadialChart>
        </View>
        <View className="flex-row flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
          {goals.map((goal) => (
            <View key={goal.name} className="flex-row items-center gap-1.5">
              <View
                accessible={false}
                className="size-2.5 rounded-full"
                style={{ backgroundColor: goal.color }}
              />
              <Text type="small" tone="muted">
                {`${goal.name} ${goal.value}%`}
              </Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title={STRINGS.even.title} description={STRINGS.even.description}>
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={STRINGS.even.summary}
          className="items-center"
        >
          <RadialChart
            data={goals}
            labelKey="name"
            valueKey="value"
            colorKey="color"
            barGap="auto"
            wrapperClassName="w-[200px]"
          >
            <RadialChart.Bar background animate={{ type: "spring", damping: 14, stiffness: 100 }} />
          </RadialChart>
        </View>
      </Section>

      <Section title={STRINGS.gauge.title} description={STRINGS.gauge.description}>
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={STRINGS.gauge.summary}
          className="items-center"
        >
          <RadialChart
            data={[{ name: "Score", value: 78, color: accent }]}
            labelKey="name"
            valueKey="value"
            colorKey="color"
            domain={[0, 100]}
            innerRadius="72%"
            wrapperClassName="w-[220px]"
          >
            <RadialChart.Bar background cornerRadius={14} />
          </RadialChart>
        </View>
        <Text type="small" tone="muted" className="text-center">
          {STRINGS.gauge.label}
        </Text>
      </Section>
    </Screen>
  );
}

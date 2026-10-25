/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `RadarChart` (@stackra-pro/ui): a single series, a circle
 *          grid with a radius axis on a fixed scale, two series overlaid, and dots only.
 * Boundary: presentation and demo data only; the chart is @stackra-pro/ui's, series colours come from theme tokens.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { RadarChart } from "@stackra-pro/ui/native";
import { useThemeColor } from "heroui-native";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basic: {
    title: "Single series",
    description: "A polygon grid, the category labels around it and one filled series.",
    summary: "Radar chart of team A scores: speed 80, quality 65, reach 70, cost 55, support 90.",
  },
  scale: {
    title: "Circle grid and radius axis",
    description:
      '`shape="circle"` draws round rings; `maxValue` fixes the scale and the axis labels it.',
    summary: "Radar chart of team A scores on a fixed 0 to 100 scale with round rings.",
  },
  multi: {
    title: "Two series",
    description:
      "One `Radar` per series with its own `dataKey` and colour, on the same categories.",
    summary: "Radar chart comparing team A and team B scores.",
  },
  dots: {
    title: "Dots only",
    description: "`fillOpacity={0}` with `showDots` shows each vertex as a marker.",
    summary: "Radar chart of team A scores drawn as dots with an outline.",
  },
} as const;

const SCORES = [
  { category: "Speed", teamA: 80, teamB: 60 },
  { category: "Quality", teamA: 65, teamB: 85 },
  { category: "Reach", teamA: 70, teamB: 55 },
  { category: "Cost", teamA: 55, teamB: 75 },
  { category: "Support", teamA: 90, teamB: 70 },
];

/** The RadarChart page: one section per layout, in a scrollable screen. */
export function RadarChartScreen() {
  const [accent, warning] = useThemeColor(["accent", "warning"]);

  return (
    <Screen>
      <Section title={STRINGS.basic.title} description={STRINGS.basic.description}>
        <View accessible accessibilityRole="image" accessibilityLabel={STRINGS.basic.summary}>
          <RadarChart
            data={SCORES}
            labelKey="category"
            dataKey="teamA"
            wrapperClassName="h-[280px]"
          >
            <RadarChart.Grid />
            <RadarChart.AngleAxis />
            <RadarChart.Radar />
          </RadarChart>
        </View>
      </Section>

      <Section title={STRINGS.scale.title} description={STRINGS.scale.description}>
        <View accessible accessibilityRole="image" accessibilityLabel={STRINGS.scale.summary}>
          <RadarChart
            data={SCORES}
            labelKey="category"
            dataKey="teamA"
            maxValue={100}
            wrapperClassName="h-[300px]"
          >
            <RadarChart.Grid shape="circle" />
            <RadarChart.AngleAxis />
            <RadarChart.RadiusAxis includeZero tickFormatter={(value) => `${Math.round(value)}%`} />
            <RadarChart.Radar />
          </RadarChart>
        </View>
      </Section>

      <Section title={STRINGS.multi.title} description={STRINGS.multi.description}>
        <View accessible accessibilityRole="image" accessibilityLabel={STRINGS.multi.summary}>
          <RadarChart
            data={SCORES}
            labelKey="category"
            dataKey="teamA"
            maxValue={100}
            wrapperClassName="h-[300px]"
          >
            <RadarChart.Grid />
            <RadarChart.AngleAxis />
            <RadarChart.Radar dataKey="teamA" color={accent} />
            <RadarChart.Radar dataKey="teamB" color={warning} />
          </RadarChart>
        </View>
      </Section>

      <Section title={STRINGS.dots.title} description={STRINGS.dots.description}>
        <View accessible accessibilityRole="image" accessibilityLabel={STRINGS.dots.summary}>
          <RadarChart
            data={SCORES}
            labelKey="category"
            dataKey="teamA"
            wrapperClassName="h-[280px]"
          >
            <RadarChart.Grid />
            <RadarChart.AngleAxis />
            <RadarChart.Radar
              color={accent}
              fillOpacity={0}
              strokeWidth={2}
              showDots
              dotRadius={4}
            />
          </RadarChart>
        </View>
      </Section>
    </Screen>
  );
}

/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `PieChart` (@stackra/ui-pro): a pie, a donut, a segmented
 *          donut with gaps between the slices and a half-circle arc, each with a legend that does not rest on colour.
 * Boundary: presentation and demo data only; the chart is @stackra/ui-pro's, slice colours come from theme tokens.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { PieChart } from "@stackra/ui-pro/native";
import { Typography, useThemeColor } from "heroui-native";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  pie: {
    title: "Pie",
    description: "One slice per row; the slice colour comes from the `colorKey` field of the data.",
    summary: "Pie chart of browser usage: Chrome 62%, Safari 19%, Firefox 10%, Edge 9%.",
  },
  donut: {
    title: "Donut",
    description: "`innerRadius` on `Pie` cuts out the centre; a percentage is of the outer radius.",
    summary: "Donut chart of browser usage.",
  },
  segmented: {
    title: "Segmented donut",
    description: "`SliceAngularInset` paints a stroke between slices in the background colour.",
    summary: "Segmented donut chart of browser usage.",
  },
  arc: {
    title: "Partial arc",
    description: "`startAngle` and `circleSweepDegrees` draw a half circle, as for a gauge.",
    summary: "Half-circle arc chart of browser usage.",
  },
} as const;

const BROWSERS = [
  { name: "Chrome", value: 62 },
  { name: "Safari", value: 19 },
  { name: "Firefox", value: 10 },
  { name: "Edge", value: 9 },
] as const;

/** The PieChart page: one section per shape, in a scrollable screen. */
export function PieChartScreen() {
  const [accent, success, warning, danger, background] = useThemeColor([
    "accent",
    "success",
    "warning",
    "danger",
    "background",
  ]);
  const colors = [accent, success, warning, danger];
  const data = BROWSERS.map((browser, index) => ({ ...browser, color: colors[index] ?? accent }));

  // Slices carry no text, so the legend names every slice and its share next to its colour.
  const legend = (
    <View className="flex-row flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
      {data.map((entry) => (
        <View key={entry.name} className="flex-row items-center gap-1.5">
          <View
            accessible={false}
            className="size-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <Typography.Paragraph type="body-sm" color="muted">
            {`${entry.name} ${entry.value}%`}
          </Typography.Paragraph>
        </View>
      ))}
    </View>
  );

  return (
    <Screen>
      <Section title={STRINGS.pie.title} description={STRINGS.pie.description}>
        <View accessible accessibilityRole="image" accessibilityLabel={STRINGS.pie.summary}>
          <PieChart
            data={data}
            labelKey="name"
            valueKey="value"
            colorKey="color"
            wrapperClassName="h-[220px]"
          >
            <PieChart.Pie>{() => <PieChart.Slice />}</PieChart.Pie>
          </PieChart>
        </View>
        {legend}
      </Section>

      <Section title={STRINGS.donut.title} description={STRINGS.donut.description}>
        <View accessible accessibilityRole="image" accessibilityLabel={STRINGS.donut.summary}>
          <PieChart
            data={data}
            labelKey="name"
            valueKey="value"
            colorKey="color"
            wrapperClassName="h-[220px]"
          >
            <PieChart.Pie innerRadius="68%">{() => <PieChart.Slice />}</PieChart.Pie>
          </PieChart>
        </View>
      </Section>

      <Section title={STRINGS.segmented.title} description={STRINGS.segmented.description}>
        <View accessible accessibilityRole="image" accessibilityLabel={STRINGS.segmented.summary}>
          <PieChart
            data={data}
            labelKey="name"
            valueKey="value"
            colorKey="color"
            wrapperClassName="h-[220px]"
          >
            <PieChart.Pie innerRadius="60%">
              {() => (
                <>
                  <PieChart.Slice animate={{ type: "timing", duration: 500 }} />
                  <PieChart.SliceAngularInset
                    angularInset={{ angularStrokeWidth: 4, angularStrokeColor: background }}
                  />
                </>
              )}
            </PieChart.Pie>
          </PieChart>
        </View>
      </Section>

      <Section title={STRINGS.arc.title} description={STRINGS.arc.description}>
        <View accessible accessibilityRole="image" accessibilityLabel={STRINGS.arc.summary}>
          <PieChart
            data={data}
            labelKey="name"
            valueKey="value"
            colorKey="color"
            wrapperClassName="h-[160px]"
          >
            <PieChart.Pie innerRadius="55%" startAngle={-90} circleSweepDegrees={180}>
              {() => <PieChart.Slice />}
            </PieChart.Pie>
          </PieChart>
        </View>
      </Section>
    </Screen>
  );
}

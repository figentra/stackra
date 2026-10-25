/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Widget` (@stackra-pro/ui): a card with title, legend and a
 *          payload, with a description, and with a footer, each holding a small line chart or a figure.
 * Boundary: presentation and demo data only; the widget is @stackra-pro/ui's, legend colours are theme classes.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { LineChart, NumberValue, Widget } from "@stackra-pro/ui/native";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  legend: {
    title: "Title and legend",
    description: "The header pairs the title with a legend; the content sits on an elevated card.",
    widget: "Visits over time",
    organic: "Organic",
    paid: "Paid",
    summary: "Line chart of organic and paid visits per month; paid grows faster.",
  },
  hint: {
    title: "Title and description",
    description: "A `Widget.Description` under the title gives the period or a hint.",
    widget: "Requests",
    period: "Last 30 days",
    suffix: "requests",
  },
  footer: {
    title: "Footer",
    description: "`Widget.Footer` holds a muted summary or actions below the content.",
    widget: "Revenue",
    updated: "Updated 2 minutes ago",
  },
} as const;

const TRAFFIC = [
  { month: "Jan", organic: 120, paid: 60 },
  { month: "Feb", organic: 140, paid: 90 },
  { month: "Mar", organic: 135, paid: 120 },
  { month: "Apr", organic: 160, paid: 150 },
  { month: "May", organic: 175, paid: 190 },
  { month: "Jun", organic: 190, paid: 230 },
];

/** The Widget page: one section per composition, in a scrollable screen. */
export function WidgetScreen() {
  return (
    <Screen>
      <Section title={STRINGS.legend.title} description={STRINGS.legend.description}>
        <Widget>
          <Widget.Header>
            <Widget.Title>{STRINGS.legend.widget}</Widget.Title>
            <Widget.Legend>
              <Widget.LegendItem colorClassName="bg-chart-3">
                {STRINGS.legend.organic}
              </Widget.LegendItem>
              <Widget.LegendItem colorClassName="bg-chart-1">
                {STRINGS.legend.paid}
              </Widget.LegendItem>
            </Widget.Legend>
          </Widget.Header>
          <Widget.Content>
            <View accessible accessibilityRole="image" accessibilityLabel={STRINGS.legend.summary}>
              <LineChart
                data={TRAFFIC}
                xKey="month"
                yKeys={["organic", "paid"]}
                wrapperClassName="h-40"
              >
                {({ points }) => (
                  <>
                    <LineChart.Line points={points.organic} colorClassName="accent-chart-3" />
                    <LineChart.Line points={points.paid} colorClassName="accent-chart-1" />
                  </>
                )}
              </LineChart>
            </View>
          </Widget.Content>
        </Widget>
      </Section>

      <Section title={STRINGS.hint.title} description={STRINGS.hint.description}>
        <Widget>
          <Widget.Header>
            <View>
              <Widget.Title>{STRINGS.hint.widget}</Widget.Title>
              <Widget.Description>{STRINGS.hint.period}</Widget.Description>
            </View>
          </Widget.Header>
          <Widget.Content>
            <NumberValue value={1284503} classNames={{ value: "text-3xl font-semibold" }}>
              <NumberValue.Value />
              <NumberValue.Suffix className="ms-2 text-sm text-muted">
                {STRINGS.hint.suffix}
              </NumberValue.Suffix>
            </NumberValue>
          </Widget.Content>
        </Widget>
      </Section>

      <Section title={STRINGS.footer.title} description={STRINGS.footer.description}>
        <Widget>
          <Widget.Header>
            <Widget.Title>{STRINGS.footer.widget}</Widget.Title>
          </Widget.Header>
          <Widget.Content>
            <NumberValue
              numberStyle="currency"
              currency="USD"
              value={228441}
              classNames={{ value: "text-3xl font-semibold" }}
            />
          </Widget.Content>
          <Widget.Footer>
            <Widget.Description>{STRINGS.footer.updated}</Widget.Description>
          </Widget.Footer>
        </Widget>
      </Section>
    </Screen>
  );
}

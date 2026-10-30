/**
 * Stackra file contract:
 * Purpose: the "temperature" demo of the web RangeBarChart: Riyadh's average daily low and high temperature for each month.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { Card, RangeBarChart, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { RANGE_BAR_CHART_KEYS } from "#src/demos/free/range-bar-chart/range-bar-chart-keys.constant";

/** The demo's keys. */
const K = RANGE_BAR_CHART_KEYS.range_bar_chart;

/** Average daily low and high in °C, by month. */
const MONTHS = [
  [9, 21],
  [11, 24],
  [15, 28],
  [20, 33],
  [26, 40],
  [28, 43],
  [29, 44],
  [29, 44],
  [26, 41],
  [21, 35],
  [15, 28],
  [10, 22],
].map(([low, high], month) => ({
  month: new Date(Date.UTC(2025, month, 1)).toISOString().slice(0, 10),
  low,
  high,
}));

/** Range bar chart: temperature. */
export default function Temperature() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Card className="w-full">
      <Card.Header>
        <div className="grid gap-1">
          <Card.Title>{t(K.temperature_title)}</Card.Title>
          <Card.Description>{t(K.temperature_description)}</Card.Description>
        </div>
      </Card.Header>
      <Card.Content>
        <RangeBarChart
          data={MONTHS}
          xKey="month"
          xFormat={{ month: "short" }}
          fromKey="low"
          toKey="high"
          valueFormat={{ style: "unit", unit: "celsius" }}
          label={t(K.temperature_title)}
        />
      </Card.Content>
    </Card>
  );
}

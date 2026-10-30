/**
 * Stackra file contract:
 * Purpose: the "prices" demo of the web RangeBarChart: the lowest and highest monthly price paid per plan, as bars lying along the category axis.
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

/** Lowest and highest monthly price in riyals, by plan. */
const PLANS = [
  { plan: "starter", low: 49, high: 99 },
  { plan: "growth", low: 149, high: 299 },
  { plan: "business", low: 349, high: 699 },
  { plan: "enterprise", low: 900, high: 1800 },
] as const;

/** Range bar chart: prices. */
export default function Prices() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Card className="w-full">
      <Card.Header>
        <div className="grid gap-1">
          <Card.Title>{t(K.prices_title)}</Card.Title>
          <Card.Description>{t(K.prices_description)}</Card.Description>
        </div>
      </Card.Header>
      <Card.Content>
        <RangeBarChart
          data={PLANS.map((row) => ({ ...row, name: t(K[row.plan]) }))}
          xKey="name"
          fromKey="low"
          toKey="high"
          orientation="horizontal"
          valueFormat={{ style: "currency", currency: "SAR", maximumFractionDigits: 0 }}
          label={t(K.prices_title)}
        />
      </Card.Content>
    </Card>
  );
}

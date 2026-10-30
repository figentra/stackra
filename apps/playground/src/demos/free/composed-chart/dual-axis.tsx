/**
 * Stackra file contract:
 * Purpose: the "dual-axis" demo of the web Composed chart: visitors as columns on the first value axis and orders as
 *          a line on a second axis at the reading end, two measures a hundred times apart on one chart.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { Card, ComposedChart, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { COMPOSED_CHART_KEYS } from "#src/demos/free/composed-chart/composed-chart-keys.constant";

/** The demo's keys. */
const K = COMPOSED_CHART_KEYS.composed_chart;

/** Six months of visitors and orders. */
const DATA = [
  { month: "2026-01-01", visitors: 18_600, orders: 212 },
  { month: "2026-02-01", visitors: 30_500, orders: 388 },
  { month: "2026-03-01", visitors: 23_700, orders: 301 },
  { month: "2026-04-01", visitors: 27_300, orders: 455 },
  { month: "2026-05-01", visitors: 34_900, orders: 512 },
  { month: "2026-06-01", visitors: 41_400, orders: 640 },
];

/** Composed chart: two value axes. */
export default function DualAxis() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Card className="w-full">
      <Card.Header>
        <div className="grid gap-1">
          <Card.Title>{t(K.dual_title)}</Card.Title>
          <Card.Description>{t(K.dual_description)}</Card.Description>
        </div>
      </Card.Header>
      <Card.Content>
        <ComposedChart
          label={t(K.dual_title)}
          data={DATA}
          xKey="month"
          xFormat={{ month: "short" }}
          series={[
            { key: "visitors", label: t(K.visitors) },
            { key: "orders", label: t(K.orders), color: "chart-3" },
          ]}
          lineKeys={["orders"]}
          secondaryKeys={["orders"]}
          annotations={[{ at: "2026-04-01", label: t(K.launch) }]}
          showValueAxis
        />
      </Card.Content>
    </Card>
  );
}

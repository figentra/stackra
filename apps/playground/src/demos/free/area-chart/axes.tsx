/**
 * Stackra file contract:
 * Purpose: the "axes" demo of the web Area chart: revenue with the value axis shown and the values written as compact US dollars.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { AreaChart, Card, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { AREA_CHART_KEYS } from "#src/demos/free/area-chart/area-chart-keys.constant";

/** The demo's keys. */
const K = AREA_CHART_KEYS.area_chart;

/** Revenue by month, in US dollars. */
const DATA = [
  { month: "2026-01-01", revenue: 18_600 },
  { month: "2026-02-01", revenue: 30_500 },
  { month: "2026-03-01", revenue: 23_700 },
  { month: "2026-04-01", revenue: 27_300 },
  { month: "2026-05-01", revenue: 20_900 },
  { month: "2026-06-01", revenue: 34_400 },
];

/** Area chart: axes. */
export default function Axes() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Card className="w-full">
      <Card.Header>
        <div className="grid gap-1">
          <Card.Title>{t(K.axes_title)}</Card.Title>
          <Card.Description>{t(K.months_description)}</Card.Description>
        </div>
      </Card.Header>
      <Card.Content>
        <AreaChart
          data={DATA}
          series={[{ key: "revenue", label: t(K.revenue) }]}
          xKey="month"
          xFormat={{ month: "short" }}
          valueFormat={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
          showValueAxis
          label={t(K.axes_title)}
        />
      </Card.Content>
    </Card>
  );
}

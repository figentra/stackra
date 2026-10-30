/**
 * Stackra file contract:
 * Purpose: the "single" demo of the web Bar chart: one series of columns, with no legend.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { BarChart, Card, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { BAR_CHART_KEYS } from "#src/demos/free/bar-chart/bar-chart-keys.constant";

/** The demo's keys. */
const K = BAR_CHART_KEYS.bar_chart;

/** Visitors by month (shadcn/ui's sample data). */
const DATA = [
  { month: "2026-01-01", desktop: 186, mobile: 80 },
  { month: "2026-02-01", desktop: 305, mobile: 200 },
  { month: "2026-03-01", desktop: 237, mobile: 120 },
  { month: "2026-04-01", desktop: 73, mobile: 190 },
  { month: "2026-05-01", desktop: 209, mobile: 130 },
  { month: "2026-06-01", desktop: 214, mobile: 140 },
];

/** Bar chart: single. */
export default function Single() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Card className="w-full">
      <Card.Header>
        <div className="grid gap-1">
          <Card.Title>{t(K.single_title)}</Card.Title>
          <Card.Description>{t(K.months_description)}</Card.Description>
        </div>
      </Card.Header>
      <Card.Content>
        <BarChart
          data={DATA}
          series={[{ key: "desktop", label: t(K.desktop) }]}
          xKey="month"
          xFormat={{ month: "short" }}
          label={t(K.single_title)}
        />
      </Card.Content>
      <Card.Footer className="text-sm text-muted">{t(K.trend)}</Card.Footer>
    </Card>
  );
}

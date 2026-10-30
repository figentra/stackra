/**
 * Stackra file contract:
 * Purpose: the "dots" demo of the web Line chart: one line with every month marked by a dot.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { Card, LineChart, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { LINE_CHART_KEYS } from "#src/demos/free/line-chart/line-chart-keys.constant";

/** The demo's keys. */
const K = LINE_CHART_KEYS.line_chart;

/** Visitors by month (shadcn/ui's sample data). */
const DATA = [
  { month: "2026-01-01", desktop: 186, mobile: 80 },
  { month: "2026-02-01", desktop: 305, mobile: 200 },
  { month: "2026-03-01", desktop: 237, mobile: 120 },
  { month: "2026-04-01", desktop: 73, mobile: 190 },
  { month: "2026-05-01", desktop: 209, mobile: 130 },
  { month: "2026-06-01", desktop: 214, mobile: 140 },
];

/** Line chart: dots. */
export default function Dots() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Card className="w-full">
      <Card.Header>
        <div className="grid gap-1">
          <Card.Title>{t(K.dots_title)}</Card.Title>
          <Card.Description>{t(K.months_description)}</Card.Description>
        </div>
      </Card.Header>
      <Card.Content>
        <LineChart
          data={DATA}
          series={[{ key: "desktop", label: t(K.desktop) }]}
          xKey="month"
          xFormat={{ month: "short" }}
          showDots
          label={t(K.dots_title)}
        />
      </Card.Content>
    </Card>
  );
}

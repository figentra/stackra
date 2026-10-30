/**
 * Stackra file contract:
 * Purpose: the "horizontal" demo of the web Bar chart: one bar per browser, lying along the category axis and growing from the reading start.
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

/** Visitors by browser (shadcn/ui's sample data). */
const DATA = [
  { browser: "chrome", visitors: 275 },
  { browser: "safari", visitors: 200 },
  { browser: "firefox", visitors: 187 },
  { browser: "edge", visitors: 173 },
  { browser: "other", visitors: 90 },
] as const;

/** Bar chart: horizontal. */
export default function Horizontal() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Card className="w-full">
      <Card.Header>
        <div className="grid gap-1">
          <Card.Title>{t(K.horizontal_title)}</Card.Title>
          <Card.Description>{t(K.months_description)}</Card.Description>
        </div>
      </Card.Header>
      <Card.Content>
        <BarChart
          data={DATA.map((row) => ({ ...row, name: t(K[row.browser]) }))}
          series={[{ key: "visitors", label: t(K.visitors) }]}
          xKey="name"
          orientation="horizontal"
          label={t(K.horizontal_title)}
        />
      </Card.Content>
    </Card>
  );
}

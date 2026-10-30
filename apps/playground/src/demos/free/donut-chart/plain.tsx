/**
 * Stackra file contract:
 * Purpose: the "plain" demo of the web Donut chart: a ring of browsers with its legend and no total.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { Card, DonutChart, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { DONUT_CHART_KEYS } from "#src/demos/free/donut-chart/donut-chart-keys.constant";

/** The demo's keys. */
const K = DONUT_CHART_KEYS.donut_chart;

/** Visitors by browser (shadcn/ui's sample data). */
const DATA = [
  { browser: "chrome", visitors: 275 },
  { browser: "safari", visitors: 200 },
  { browser: "firefox", visitors: 187 },
  { browser: "edge", visitors: 173 },
  { browser: "other", visitors: 90 },
];

/** Donut chart: plain. */
export default function Plain() {
  const t = useCatalogueText(MESSAGES.en);
  const series = [
    { key: "chrome", label: t(K.chrome) },
    { key: "safari", label: t(K.safari) },
    { key: "firefox", label: t(K.firefox) },
    { key: "edge", label: t(K.edge) },
    { key: "other", label: t(K.other) },
  ];
  return (
    <Card className="w-full">
      <Card.Header>
        <div className="grid gap-1">
          <Card.Title>{t(K.plain_title)}</Card.Title>
          <Card.Description>{t(K.months_description)}</Card.Description>
        </div>
      </Card.Header>
      <Card.Content>
        <DonutChart
          data={DATA}
          series={series}
          nameKey="browser"
          valueKey="visitors"
          showLegend
          label={t(K.plain_title)}
        />
      </Card.Content>
      <Card.Footer className="text-sm text-muted">{t(K.trend)}</Card.Footer>
    </Card>
  );
}

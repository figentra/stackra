/**
 * Stackra file contract:
 * Purpose: the "log-scale" demo of the web Line chart: sign-ups growing across four powers of ten, read on a log value
 *          axis so the early months stay legible.
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

/** Sign-ups by month. */
const DATA = [
  { month: "2026-01-01", signups: 12 },
  { month: "2026-02-01", signups: 48 },
  { month: "2026-03-01", signups: 310 },
  { month: "2026-04-01", signups: 1250 },
  { month: "2026-05-01", signups: 6800 },
  { month: "2026-06-01", signups: 21_400 },
];

/** Line chart: log scale. */
export default function LogScale() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Card className="w-full">
      <Card.Header>
        <div className="grid gap-1">
          <Card.Title>{t(K.log_title)}</Card.Title>
          <Card.Description>{t(K.log_description)}</Card.Description>
        </div>
      </Card.Header>
      <Card.Content>
        <LineChart
          data={DATA}
          series={[{ key: "signups", label: t(K.signups), color: "chart-3" }]}
          xKey="month"
          xFormat={{ month: "short" }}
          valueScale="log"
          showValueAxis
          showDots
          label={t(K.log_title)}
        />
      </Card.Content>
    </Card>
  );
}

/**
 * Stackra file contract:
 * Purpose: the "synced" demo of the web Line chart: visitors and sign-ups in two charts that share a `syncId`, so
 *          pointing at a month in one shows the same month's crosshair and tooltip in the other.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { AreaChart, Card, LineChart, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { LINE_CHART_KEYS } from "#src/demos/free/line-chart/line-chart-keys.constant";

/** The demo's keys. */
const K = LINE_CHART_KEYS.line_chart;

/** Visitors and sign-ups by month. */
const DATA = [
  { month: "2026-01-01", desktop: 186, signups: 22 },
  { month: "2026-02-01", desktop: 305, signups: 41 },
  { month: "2026-03-01", desktop: 237, signups: 30 },
  { month: "2026-04-01", desktop: 273, signups: 37 },
  { month: "2026-05-01", desktop: 209, signups: 26 },
  { month: "2026-06-01", desktop: 314, signups: 48 },
];

/** Line chart: two charts pointed together. */
export default function Synced() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Card className="w-full">
      <Card.Header>
        <div className="grid gap-1">
          <Card.Title>{t(K.synced_title)}</Card.Title>
          <Card.Description>{t(K.synced_description)}</Card.Description>
        </div>
      </Card.Header>
      <Card.Content className="grid gap-4">
        <AreaChart
          data={DATA}
          series={[{ key: "desktop", label: t(K.visitors) }]}
          xKey="month"
          xFormat={{ month: "short" }}
          height={140}
          syncId="visitors-signups"
          label={t(K.visitors)}
        />
        <LineChart
          data={DATA}
          series={[{ key: "signups", label: t(K.signups), color: "chart-3" }]}
          xKey="month"
          xFormat={{ month: "short" }}
          height={140}
          syncId="visitors-signups"
          label={t(K.signups)}
        />
      </Card.Content>
    </Card>
  );
}

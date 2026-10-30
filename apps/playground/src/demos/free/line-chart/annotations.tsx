/**
 * Stackra file contract:
 * Purpose: the "annotations" demo of the web Line chart: visitors by month with a target line and two notes pinned to
 *          their months, a launch and an outage.
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

/** Visitors by month. */
const DATA = [
  { month: "2026-01-01", desktop: 186 },
  { month: "2026-02-01", desktop: 205 },
  { month: "2026-03-01", desktop: 237 },
  { month: "2026-04-01", desktop: 143 },
  { month: "2026-05-01", desktop: 289 },
  { month: "2026-06-01", desktop: 314 },
];

/** Line chart: annotations. */
export default function Annotations() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Card className="w-full">
      <Card.Header>
        <div className="grid gap-1">
          <Card.Title>{t(K.annotations_title)}</Card.Title>
          <Card.Description>{t(K.annotations_description)}</Card.Description>
        </div>
      </Card.Header>
      <Card.Content>
        <LineChart
          data={DATA}
          series={[{ key: "desktop", label: t(K.visitors) }]}
          xKey="month"
          xFormat={{ month: "short" }}
          showDots
          showValueAxis
          references={[{ value: 250, label: t(K.target) }]}
          annotations={[
            { at: "2026-02-01", label: t(K.launch), color: "chart-2" },
            { at: "2026-04-01", label: t(K.outage), color: "danger" },
          ]}
          label={t(K.annotations_title)}
        />
      </Card.Content>
    </Card>
  );
}

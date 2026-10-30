/**
 * Stackra file contract:
 * Purpose: the "store-and-online" demo of the web PolarChart: branch and online orders by month as two slices in
 *          each month's sector, with the legend.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { Card, PolarChart, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { POLAR_CHART_KEYS } from "#src/demos/free/polar-chart/polar-chart-keys.constant";

/** The demo's keys. */
const K = POLAR_CHART_KEYS.polar_chart;

/** Orders per month at the branch and online. */
const DATA = [
  { month: "2026-01-01", branch: 1240, online: 860 },
  { month: "2026-02-01", branch: 1110, online: 940 },
  { month: "2026-03-01", branch: 1630, online: 1520 },
  { month: "2026-04-01", branch: 980, online: 1210 },
  { month: "2026-05-01", branch: 1050, online: 1340 },
  { month: "2026-06-01", branch: 1190, online: 1580 },
];

/** PolarChart: Branch and online. */
export default function StoreAndOnline() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Card className="w-full max-w-md">
      <Card.Header>
        <div className="grid gap-1">
          <Card.Title>{t(K.store_title)}</Card.Title>
          <Card.Description>{t(K.store_description)}</Card.Description>
        </div>
      </Card.Header>
      <Card.Content>
        <PolarChart
          data={DATA}
          series={[
            { key: "branch", label: t(K.branch) },
            { key: "online", label: t(K.online) },
          ]}
          xKey="month"
          xFormat={{ month: "short" }}
          label={t(K.store_title)}
        />
      </Card.Content>
    </Card>
  );
}

/**
 * Stackra file contract:
 * Purpose: the "orders-by-weekday" demo of the web PolarChart: a store's orders over the last four weeks, one slice
 *          per weekday from Saturday, the weekend peak reaching furthest.
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

/** Orders per weekday; each row is a date of that weekday, written as its short name. */
const DATA = [
  { day: "2026-10-24", orders: 820 },
  { day: "2026-10-25", orders: 640 },
  { day: "2026-10-26", orders: 590 },
  { day: "2026-10-27", orders: 610 },
  { day: "2026-10-28", orders: 700 },
  { day: "2026-10-29", orders: 1180 },
  { day: "2026-10-30", orders: 1420 },
];

/** PolarChart: Orders by weekday. */
export default function OrdersByWeekday() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Card className="w-full max-w-md">
      <Card.Header>
        <div className="grid gap-1">
          <Card.Title>{t(K.orders_title)}</Card.Title>
          <Card.Description>{t(K.orders_description)}</Card.Description>
        </div>
      </Card.Header>
      <Card.Content>
        <PolarChart
          data={DATA}
          series={[{ key: "orders", label: t(K.orders) }]}
          xKey="day"
          xFormat={{ weekday: "short" }}
          label={t(K.orders_title)}
        />
      </Card.Content>
      <Card.Footer className="text-sm text-muted">{t(K.orders_footer)}</Card.Footer>
    </Card>
  );
}

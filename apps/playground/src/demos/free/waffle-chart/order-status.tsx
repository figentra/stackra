/**
 * Stackra file contract:
 * Purpose: the "order-status" demo of the web WaffleChart: this week's orders by status on a wide 20 by 5 grid in
 *          the status colours, cancelled in the danger colour.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { WaffleChart, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { WAFFLE_CHART_KEYS } from "#src/demos/free/waffle-chart/waffle-chart-keys.constant";

/** The demo's keys. */
const K = WAFFLE_CHART_KEYS.waffle_chart;

/** Orders per status. */
const DATA = [
  { status: "delivered", orders: 512 },
  { status: "shipped", orders: 176 },
  { status: "processing", orders: 118 },
  { status: "cancelled", orders: 34 },
];

/** WaffleChart: Order status, 20 by 5. */
export default function OrderStatus() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid w-full max-w-lg gap-3">
      <div className="grid gap-1">
        <p className="m-0 text-sm font-medium">{t(K.status_title)}</p>
        <p className="m-0 text-xs text-muted">{t(K.status_description)}</p>
      </div>
      <WaffleChart
        data={DATA}
        series={[
          { key: "delivered", label: t(K.delivered), color: "success" },
          { key: "shipped", label: t(K.shipped), color: "accent" },
          { key: "processing", label: t(K.processing), color: "warning" },
          { key: "cancelled", label: t(K.cancelled), color: "danger" },
        ]}
        nameKey="status"
        valueKey="orders"
        columns={20}
        rows={5}
        label={t(K.status_title)}
      />
    </div>
  );
}

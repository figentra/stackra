/**
 * Stackra file contract:
 * Purpose: the "payment-methods" demo of the web WaffleChart: how October's 1,000 orders were paid, one square per
 *          ten orders, with each method's count and share in the legend.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { Card, WaffleChart, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { WAFFLE_CHART_KEYS } from "#src/demos/free/waffle-chart/waffle-chart-keys.constant";

/** The demo's keys. */
const K = WAFFLE_CHART_KEYS.waffle_chart;

/** Orders per payment method, largest first. */
const DATA = [
  { method: "card", orders: 486 },
  { method: "cod", orders: 274 },
  { method: "wallet", orders: 168 },
  { method: "later", orders: 72 },
];

/** WaffleChart: Payment methods. */
export default function PaymentMethods() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Card className="w-full max-w-md">
      <Card.Header>
        <div className="grid gap-1">
          <Card.Title>{t(K.payments_title)}</Card.Title>
          <Card.Description>{t(K.payments_description)}</Card.Description>
        </div>
      </Card.Header>
      <Card.Content>
        <WaffleChart
          data={DATA}
          series={[
            { key: "card", label: t(K.card) },
            { key: "cod", label: t(K.cod) },
            { key: "wallet", label: t(K.wallet) },
            { key: "later", label: t(K.later) },
          ]}
          nameKey="method"
          valueKey="orders"
          label={t(K.payments_title)}
        />
      </Card.Content>
    </Card>
  );
}

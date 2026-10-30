/**
 * Stackra file contract:
 * Purpose: the "orders" demo of the web HistogramChart: October's order totals counted into price bands.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { Card, HistogramChart, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { HISTOGRAM_CHART_KEYS } from "#src/demos/free/histogram-chart/histogram-chart-keys.constant";

/** The demo's keys. */
const K = HISTOGRAM_CHART_KEYS.histogram_chart;

/** 240 order totals in riyals, a steady skewed spread so the demo draws the same every time. */
const TOTALS = Array.from({ length: 240 }, (_, index) => {
  const wave = Math.sin(index * 12.9898) * 43_758.5453;
  const spread = wave - Math.floor(wave);
  return Math.round(20 + 140 * spread * spread + ((index * 7) % 30));
});

/** Histogram chart: orders. */
export default function Orders() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Card className="w-full">
      <Card.Header>
        <div className="grid gap-1">
          <Card.Title>{t(K.orders_title)}</Card.Title>
          <Card.Description>{t(K.orders_description)}</Card.Description>
        </div>
      </Card.Header>
      <Card.Content>
        <HistogramChart
          values={TOTALS}
          binWidth={20}
          valueFormat={{ maximumFractionDigits: 0 }}
          label={t(K.orders_title)}
        />
      </Card.Content>
      <Card.Footer className="text-sm text-muted">{t(K.orders_note)}</Card.Footer>
    </Card>
  );
}

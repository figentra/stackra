/**
 * Stackra file contract:
 * Purpose: the "delivery" demo of the web BoxPlotChart: minutes from order to door in four cities, with each city's quartiles, whiskers and outliers.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { BoxPlotChart, Card, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { BOX_PLOT_CHART_KEYS } from "#src/demos/free/box-plot-chart/box-plot-chart-keys.constant";

/** The demo's keys. */
const K = BOX_PLOT_CHART_KEYS.box_plot_chart;

/** Sixty steady delivery times around `centre` minutes, with a few late runs. */
const minutes = (centre: number, spread: number, seed: number) =>
  Array.from({ length: 60 }, (_, index) => {
    const wave = Math.sin((index + seed) * 78.233) * 43_758.5453;
    const late = index % 23 === 0 ? spread * 2.6 : 0;
    return Math.round(centre + spread * (wave - Math.floor(wave) - 0.5) * 2 + late);
  });

/** Box plot chart: delivery. */
export default function Delivery() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Card className="w-full">
      <Card.Header>
        <div className="grid gap-1">
          <Card.Title>{t(K.delivery_title)}</Card.Title>
          <Card.Description>{t(K.delivery_description)}</Card.Description>
        </div>
      </Card.Header>
      <Card.Content>
        <BoxPlotChart
          groups={[
            { key: "riyadh", label: t(K.riyadh), values: minutes(34, 9, 1) },
            { key: "jeddah", label: t(K.jeddah), values: minutes(41, 12, 2) },
            { key: "dammam", label: t(K.dammam), values: minutes(29, 7, 3) },
            { key: "makkah", label: t(K.makkah), values: minutes(46, 14, 4) },
          ]}
          valueFormat={{ maximumFractionDigits: 0 }}
          label={t(K.delivery_title)}
        />
      </Card.Content>
    </Card>
  );
}

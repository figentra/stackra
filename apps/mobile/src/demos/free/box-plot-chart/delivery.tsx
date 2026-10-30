/**
 * Stackra file contract:
 * Purpose: the "delivery" demo of the native BoxPlotChart: minutes from order to door in four cities.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371.
 */
import { BoxPlotChart, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { BOX_PLOT_CHART_DEMO_KEYS } from "#src/demos/free/box-plot-chart/box-plot-chart-demo-keys.constant";

/** The demo's keys. */
const K = BOX_PLOT_CHART_DEMO_KEYS.demo_free.box_plot_chart.delivery;

/** Sixty steady delivery times around `centre` minutes, with a few late runs. */
const minutes = (centre: number, spread: number, seed: number) =>
  Array.from({ length: 60 }, (_, index) => {
    const wave = Math.sin((index + seed) * 78.233) * 43_758.5453;
    const late = index % 23 === 0 ? spread * 2.6 : 0;
    return Math.round(centre + spread * (wave - Math.floor(wave) - 0.5) * 2 + late);
  });

/** Delivery minutes by city. */
export default function Delivery() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <BoxPlotChart
      groups={[
        { key: "riyadh", label: t(K.riyadh), values: minutes(34, 9, 1) },
        { key: "jeddah", label: t(K.jeddah), values: minutes(41, 12, 2) },
        { key: "dammam", label: t(K.dammam), values: minutes(29, 7, 3) },
        { key: "makkah", label: t(K.makkah), values: minutes(46, 14, 4) },
      ]}
      valueFormat={{ maximumFractionDigits: 0 }}
      label={t(K.label)}
    />
  );
}

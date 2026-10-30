/**
 * Stackra file contract:
 * Purpose: the "monthly-returns" demo of the native PolarChart: a year of returned items, twelve slices in the
 *          categorical palette's first colour.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { PolarChart, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { POLAR_CHART_DEMO_KEYS } from "#src/demos/free/polar-chart/polar-chart-demo-keys.constant";

/** The demo's keys. */
const K = POLAR_CHART_DEMO_KEYS.demo_free.polar_chart.monthly_returns;

/** Items returned per month. */
const RETURNS = [212, 168, 121, 140, 186, 158, 132, 118, 127, 149, 174, 236];
const DATA = RETURNS.map((returns, index) => ({
  month: `2026-${String(index + 1).padStart(2, "0")}-01`,
  returns,
}));

/** PolarChart: Returns by month. */
export default function MonthlyReturns() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <PolarChart
      data={DATA}
      series={[{ key: "returns", label: t(K.returns) }]}
      xKey="month"
      xFormat={{ month: "short" }}
      palette="categorical"
      height={300}
      label={t(K.label)}
    />
  );
}

/**
 * Stackra file contract:
 * Purpose: the "monthly-returns" demo of the web PolarChart: a year of returned items, twelve slices in the
 *          categorical palette's first colour, the post-holiday months reaching furthest.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { PolarChart, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { POLAR_CHART_KEYS } from "#src/demos/free/polar-chart/polar-chart-keys.constant";

/** The demo's keys. */
const K = POLAR_CHART_KEYS.polar_chart;

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
    <div className="grid w-full max-w-md gap-1">
      <p className="m-0 text-sm font-medium">{t(K.returns_title)}</p>
      <p className="m-0 text-xs text-muted">{t(K.returns_description)}</p>
      <PolarChart
        data={DATA}
        series={[{ key: "returns", label: t(K.returns) }]}
        xKey="month"
        xFormat={{ month: "short" }}
        palette="categorical"
        height={300}
        label={t(K.returns_title)}
      />
    </div>
  );
}

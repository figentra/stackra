/**
 * Stackra file contract:
 * Purpose: the "toggles" demo of the web Chart legend: each entry a toggle button: a hidden series reads as a hollow swatch and a
 *          struck label, and the count is announced.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import type { ChartSeries } from "@stackra/ui/contracts";
import { ChartLegend, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CHART_LEGEND_KEYS } from "#src/demos/free/chart-legend/chart-legend-keys.constant";

/** The demo's keys. */
const K = CHART_LEGEND_KEYS.chart_legend;

/** Chart legend: Hide and show series. */
export default function Toggles() {
  const t = useCatalogueText(MESSAGES.en);
  const [hidden, setHidden] = useState<readonly string[]>(["phone"]);
  const series: readonly ChartSeries[] = [
    { key: "online", label: t(K.online) },
    { key: "store", label: t(K.in_store) },
    { key: "phone", label: t(K.phone) },
  ];
  return (
    <div className="grid gap-3">
      <ChartLegend
        series={series}
        hiddenKeys={hidden}
        onToggle={(key) =>
          setHidden(hidden.includes(key) ? hidden.filter((item) => item !== key) : [...hidden, key])
        }
      />
      <Text type="small" tone="muted" align="center" aria-live="polite">
        {t(K.hidden, { count: hidden.length })}
      </Text>
    </div>
  );
}

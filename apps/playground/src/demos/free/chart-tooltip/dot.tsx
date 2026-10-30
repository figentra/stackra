/**
 * Stackra file contract:
 * Purpose: the "dot" demo of the web Chart tooltip: the card at one pointed row, as Recharts hands it over: a dot per series and
 *          the values in the locale.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { ChartTooltip, useCatalogueText, useDesignSystem } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CHART_TOOLTIP_KEYS } from "#src/demos/free/chart-tooltip/chart-tooltip-keys.constant";

/** The demo's keys. */
const K = CHART_TOOLTIP_KEYS.chart_tooltip;

/** Chart tooltip: Dot indicator. */
export default function Dot() {
  const t = useCatalogueText(MESSAGES.en);
  const { locale } = useDesignSystem();
  const number = new Intl.NumberFormat(locale);
  return (
    <div className="flex justify-center">
      <ChartTooltip
        active
        label={t(K.march)}
        formatLabel={(label) => String(label)}
        formatValue={(value) => number.format(value)}
        payload={[
          { name: t(K.online), value: 18_420, color: "var(--chart-ramp-1)", dataKey: "online" },
          { name: t(K.in_store), value: 9310, color: "var(--chart-ramp-2)", dataKey: "store" },
        ]}
      />
    </div>
  );
}

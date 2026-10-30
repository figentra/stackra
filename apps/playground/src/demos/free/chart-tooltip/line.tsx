/**
 * Stackra file contract:
 * Purpose: the "line" demo of the web Chart tooltip: the line indicator, a title written from the row's week and the values as
 *          money in the locale.
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

/** Chart tooltip: Line indicator and formats. */
export default function Line() {
  const t = useCatalogueText(MESSAGES.en);
  const { locale } = useDesignSystem();
  const money = new Intl.NumberFormat(locale, { style: "currency", currency: "SAR" });
  return (
    <div className="flex justify-center">
      <ChartTooltip
        active
        indicator="line"
        label={12}
        formatLabel={(week) => t(K.week, { week: Number(week) })}
        formatValue={(value) => money.format(value)}
        payload={[
          { name: t(K.revenue), value: 48_250.5, color: "var(--chart-1)", dataKey: "revenue" },
          { name: t(K.refunds), value: 1120, color: "var(--chart-4)", dataKey: "refunds" },
        ]}
      />
    </div>
  );
}

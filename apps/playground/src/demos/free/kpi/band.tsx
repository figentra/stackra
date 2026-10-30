/**
 * Stackra file contract:
 * Purpose: the "band" demo of the web Kpi: a band of kpis.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { KpiGroup, Stat, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { KPI_KEYS } from "#src/demos/free/kpi/kpi-keys.constant";

/** The demo's keys. */
const K = KPI_KEYS.kpi;

/** KPI: a month at a glance in one band. */
export default function Band() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <KpiGroup label={t(K.band)} className="w-full">
      <Stat
        label={t(K.revenue)}
        value={184_200}
        trend={0.124}
        sparkline={[12, 14, 13, 17, 16, 19, 22]}
      />
      <Stat label={t(K.orders)} value={2140} trend={0.06} comparison={t(K.vs_last)} />
      <Stat label={t(K.refunds)} value={38} trend={0.18} better="down" />
      <Stat label={t(K.basket)} value={86} target={100} />
    </KpiGroup>
  );
}

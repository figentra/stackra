/**
 * Stackra file contract:
 * Purpose: the "tiles" demo of the web Kpi: tiles with icons and drill-down.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { Kpi, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { KPI_KEYS } from "#src/demos/free/kpi/kpi-keys.constant";

/** The demo's keys. */
const K = KPI_KEYS.kpi;

/** KPI: tiles with an icon; pressing one drills in. */
export default function Tiles() {
  const t = useCatalogueText(MESSAGES.en);
  const [opened, setOpened] = useState("");
  return (
    <div className="grid w-full gap-4 sm:grid-cols-2">
      <Kpi
        icon="wallet"
        label={t(K.revenue)}
        value={184_200}
        trend={0.124}
        comparison={t(K.vs_last)}
        onPress={() => setOpened(t(K.revenue))}
      />
      <Kpi
        icon="users"
        label={t(K.customers)}
        value={312}
        trend={-0.04}
        onPress={() => setOpened(t(K.customers))}
      />
      <p role="status" className="m-0 text-sm text-muted sm:col-span-2">
        {opened ? t(K.opened, { name: opened }) : ""}
      </p>
    </div>
  );
}

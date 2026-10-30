/**
 * Stackra file contract:
 * Purpose: the "previous" demo of the web Kpi: tiles compared with the previous period (the trend worked out from
 *          `previousValue`), each opening its detail when pressed.
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

/** KPI: this period against the previous one, with drill-down. */
export default function Previous() {
  const t = useCatalogueText(MESSAGES.en);
  const [opened, setOpened] = useState("");
  return (
    <div className="grid w-full gap-4 sm:grid-cols-3">
      <Kpi
        icon="wallet"
        label={t(K.revenue)}
        value={184_200}
        previousValue={163_900}
        onPress={() => setOpened(t(K.revenue))}
      />
      <Kpi
        icon="shopping-cart"
        label={t(K.orders)}
        value={1284}
        previousValue={1340}
        onPress={() => setOpened(t(K.orders))}
      />
      <Kpi
        icon="receipt"
        label={t(K.refunds)}
        value={42}
        previousValue={57}
        better="down"
        onPress={() => setOpened(t(K.refunds))}
      />
      <p role="status" className="m-0 text-sm text-muted sm:col-span-3">
        {opened ? t(K.opened, { name: opened }) : ""}
      </p>
    </div>
  );
}

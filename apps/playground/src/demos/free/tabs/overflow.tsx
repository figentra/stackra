/**
 * Stackra file contract:
 * Purpose: the "overflow" demo of the web Tabs: eight reports in a narrow card; the tabs that do not fit move into a
 *          "More" menu, and the one picked from it joins the row.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave C).
 */
import { Surface, Tabs, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { TABS_KEYS } from "#src/routes/tabs/tabs-keys.constant";

/** The demo's keys. */
const K = TABS_KEYS.tabs.overflow;

/** The reports, in order. */
const REPORTS = [
  "sales",
  "orders",
  "returns",
  "customers",
  "inventory",
  "payouts",
  "taxes",
  "shipping",
] as const;

/** Tabs: more reports than room. */
export default function Overflow() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Surface variant="secondary" className="w-full max-w-md p-3">
      <Tabs
        label={t(K.label)}
        overflow="menu"
        items={REPORTS.map((id) => ({
          id,
          label: t(K[id]),
          content: (
            <p className="m-0 py-3 text-sm text-muted">{t(K.content, { report: t(K[id]) })}</p>
          ),
        }))}
      />
    </Surface>
  );
}

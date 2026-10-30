/**
 * Stackra file contract:
 * Purpose: the "arabic" demo of the web Bar list: in Arabic the bars grow from the right.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { BarList, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { BAR_LIST_KEYS } from "#src/demos/free/bar-list/bar-list-keys.constant";

/** The demo's keys. */
const K = BAR_LIST_KEYS.bar_list.arabic;

/** Bar list: in Arabic the bars grow from the right. */
export default function Arabic() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div dir="rtl" lang="ar" className="w-full max-w-md">
      <BarList
        label={t(K.label)}
        valueFormat={{ style: "currency", currency: "SAR", maximumFractionDigits: 0 }}
        items={[
          { key: "ruh", label: t(K.riyadh), value: 482_300 },
          { key: "jed", label: t(K.jeddah), value: 391_750 },
          { key: "dmm", label: t(K.dammam), value: 214_900 },
        ]}
      />
    </div>
  );
}

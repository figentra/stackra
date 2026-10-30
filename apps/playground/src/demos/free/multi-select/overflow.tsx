/**
 * Stackra file contract:
 * Purpose: the "overflow" demo of the web MultiSelect: Select all in the list, and chips past two folded into +N.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { MultiSelect, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { MULTI_SELECT_OVERFLOW_KEYS } from "#src/demos/free/multi-select/multi-select-overflow-keys.constant";

/** The demo's keys. */
const K = MULTI_SELECT_OVERFLOW_KEYS.multi_select_overflow;

/** Multi-select: select all, and a +N overflow. */
export default function Overflow() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <MultiSelect
      label={t(K.label)}
      hasSelectAll
      maxVisible={2}
      defaultValue={["ruh", "jed", "dmm", "mkk"]}
      items={[
        { id: "ruh", label: t(K.riyadh) },
        { id: "jed", label: t(K.jeddah) },
        { id: "dmm", label: t(K.dammam) },
        { id: "mkk", label: t(K.makkah) },
        { id: "med", label: t(K.madinah) },
        { id: "abh", label: t(K.abha) },
      ]}
    />
  );
}

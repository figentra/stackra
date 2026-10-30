/**
 * Stackra file contract:
 * Purpose: the "arabic" demo of the web Listbox: in Arabic the checkmark sits on the left, at the reading end.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Listbox, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { LISTBOX_KEYS } from "#src/demos/free/listbox/listbox-keys.constant";

/** The demo's keys. */
const K = LISTBOX_KEYS.listbox.arabic;

/** Listbox: in Arabic the checkmark sits on the left, at the reading end. */
export default function Arabic() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div dir="rtl" lang="ar" className="w-full max-w-md">
      <Listbox
        label={t(K.label)}
        defaultValue={["olaya"]}
        items={[
          { id: "olaya", label: t(K.olaya), description: t(K.olaya_hint) },
          { id: "malqa", label: t(K.malqa), description: t(K.malqa_hint) },
          { id: "sulay", label: t(K.sulay), description: t(K.sulay_hint), isDisabled: true },
        ]}
      />
    </div>
  );
}

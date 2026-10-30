/**
 * Stackra file contract:
 * Purpose: the "branch" demo of the native Listbox: one branch for pickup, one closed for renovation.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Listbox, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { LISTBOX_DEMO_KEYS } from "#src/demos/free/listbox/listbox-demo-keys.constant";

/** The demo's keys. */
const K = LISTBOX_DEMO_KEYS.demo_free.listbox.branch;

/** Listbox: one branch for pickup, one closed for renovation. */
export default function Branch() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View>
      <Listbox
        label={t(K.label)}
        defaultValue={["olaya"]}
        items={[
          { id: "olaya", label: t(K.olaya), description: t(K.olaya_hint) },
          { id: "malqa", label: t(K.malqa), description: t(K.malqa_hint) },
          { id: "sulay", label: t(K.sulay), description: t(K.sulay_hint), isDisabled: true },
        ]}
      />
    </View>
  );
}

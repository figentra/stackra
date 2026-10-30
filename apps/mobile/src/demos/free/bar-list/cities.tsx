/**
 * Stackra file contract:
 * Purpose: the "cities" demo of the native Bar list: this quarter's sales by city, ranked.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { BarList, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { BAR_LIST_DEMO_KEYS } from "#src/demos/free/bar-list/bar-list-demo-keys.constant";

/** The demo's keys. */
const K = BAR_LIST_DEMO_KEYS.demo_free.bar_list.cities;

/** Bar list: this quarter's sales by city, ranked. */
export default function Cities() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View>
      <BarList
        label={t(K.label)}
        valueFormat={{ style: "currency", currency: "SAR", maximumFractionDigits: 0 }}
        items={[
          { key: "ruh", label: t(K.riyadh), value: 482_300 },
          { key: "jed", label: t(K.jeddah), value: 391_750 },
          { key: "dmm", label: t(K.dammam), value: 214_900 },
          { key: "mkk", label: t(K.makkah), value: 168_400 },
          { key: "abh", label: t(K.abha), value: 61_200 },
        ]}
      />
    </View>
  );
}

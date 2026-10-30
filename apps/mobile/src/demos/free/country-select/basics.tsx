/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Country select: Basics.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); wave 3a forms and pickers
 *          (owner approval 2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { CountrySelect, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { COUNTRY_SELECT_DEMO_KEYS } from "#src/demos/free/country-select/country-select-demo-keys.constant";

/** The demo's keys. */
const K = COUNTRY_SELECT_DEMO_KEYS.demo_free.country_select.basics;

/** Country select: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      <CountrySelect
        label={t(K.label)}
        placeholder={t(K.placeholder)}
        preferred={["SA", "AE", "KW", "QA", "BH", "OM"]}
        defaultValue="SA"
      />
    </View>
  );
}

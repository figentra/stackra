/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Native select: Basics.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); wave 3a forms and pickers
 *          (owner approval 2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { NativeSelect, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { NATIVE_SELECT_DEMO_KEYS } from "#src/demos/free/native-select/native-select-demo-keys.constant";

/** The demo's keys. */
const K = NATIVE_SELECT_DEMO_KEYS.demo_free.native_select.basics;

/** Native select: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      <NativeSelect
        label={t(K.label)}
        description={t(K.hint)}
        placeholder={t(K.placeholder)}
        items={[
          { id: "ruh", label: t(K.riyadh) },
          { id: "jed", label: t(K.jeddah) },
          { id: "dmm", label: t(K.dammam) },
        ]}
      />
    </View>
  );
}

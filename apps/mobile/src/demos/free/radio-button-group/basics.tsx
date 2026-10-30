/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Radio cards: Basics.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); wave 3a forms and pickers
 *          (owner approval 2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { RadioButtonGroup, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { RADIO_BUTTON_GROUP_DEMO_KEYS } from "#src/demos/free/radio-button-group/radio-button-group-demo-keys.constant";

/** The demo's keys. */
const K = RADIO_BUTTON_GROUP_DEMO_KEYS.demo_free.radio_button_group.basics;

/** Radio cards: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      <RadioButtonGroup
        label={t(K.label)}
        defaultValue="growth"
        items={[
          { id: "starter", label: t(K.starter), description: t(K.starter_line) },
          { id: "growth", label: t(K.growth), description: t(K.growth_line) },
          { id: "scale", label: t(K.scale), description: t(K.scale_line) },
        ]}
      />
    </View>
  );
}

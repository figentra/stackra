/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Toggle button: a mute and a favourite toggle, alone.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Icon, Text, ToggleButton, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TOGGLE_BUTTON_DEMO_KEYS } from "#src/demos/free/toggle-button/toggle-button-demo-keys.constant";

/** The demo's keys. */
const K = TOGGLE_BUTTON_DEMO_KEYS.demo_free.toggle_button.sample;

/** Toggle button: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="flex-row gap-3">
      <ToggleButton>
        <Icon name="bell" />
        <Text>{t(K.mute)}</Text>
      </ToggleButton>
      <ToggleButton isIconOnly variant="ghost" label={t(K.favourite)}>
        <Icon name="heart" />
      </ToggleButton>
    </View>
  );
}

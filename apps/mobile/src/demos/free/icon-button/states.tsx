/**
 * Stackra file contract:
 * Purpose: the "states" demo of the native IconButton: `isDisabled`, and `isLoading` where a spinner replaces the icon.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { IconButton, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";

import { MESSAGES } from "#src/constants/messages.constant";
import { ICON_BUTTON_DEMO_KEYS } from "#src/demos/free/icon-button/icon-button-demo-keys.constant";

/** The demo's keys. */
const K = ICON_BUTTON_DEMO_KEYS.demo_free.icon_button.states;

/** The size stays while it loads. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="flex-row flex-wrap gap-6">
      <Sample caption="isDisabled">
        <IconButton icon="settings" label={t(K.disabled)} isDisabled />
      </Sample>
      <Sample caption="isLoading">
        <IconButton icon="settings" label={t(K.loading)} isLoading />
      </Sample>
    </View>
  );
}

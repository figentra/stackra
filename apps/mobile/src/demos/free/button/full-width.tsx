/**
 * Stackra file contract:
 * Purpose: the "full-width" demo of the native Button: two buttons stretched to their container.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { BUTTON_KEYS } from "#src/constants/button-keys.constant";
import { MESSAGES } from "#src/constants/messages.constant";

/** The demo's keys. */
const K = BUTTON_KEYS.button.full_width;

/** `isFullWidth` stretches the button to its container. */
export default function FullWidth() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      <Button isFullWidth>{t(K.primary)}</Button>
      <Button variant="secondary" isFullWidth>
        {t(K.secondary)}
      </Button>
    </View>
  );
}

/**
 * Stackra file contract:
 * Purpose: the "icons" demo of the native Button: a start icon, an end icon (mirrored in RTL) and both.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, Icon, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { BUTTON_KEYS } from "#src/constants/button-keys.constant";
import { MESSAGES } from "#src/constants/messages.constant";

/** The demo's keys. */
const K = BUTTON_KEYS.button.icons;

/** `startIcon`, `endIcon` or both; the end icon is mirrored in right-to-left. */
export default function Icons() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="flex-row flex-wrap gap-3">
      <Button variant="secondary" startIcon="plus">
        {t(K.add)}
      </Button>
      <Button variant="secondary" endIcon={<Icon name="chevron-right" />}>
        {t(K.next)}
      </Button>
      <Button variant="secondary" startIcon="download" endIcon={<Icon name="chevron-right" />}>
        {t(K.download)}
      </Button>
    </View>
  );
}

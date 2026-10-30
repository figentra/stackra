/**
 * Stackra file contract:
 * Purpose: the "icon-context" demo of the native VisuallyHidden: a shift summary heading that VoiceOver and TalkBack
 *          read with its context ("for the morning shift, register 2"), which the screen leaves to the layout.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); ADR 0060.
 */
import { Text, useCatalogueText, VisuallyHidden } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { VISUALLY_HIDDEN_DEMO_KEYS } from "#src/demos/free/visually-hidden/visually-hidden-demo-keys.constant";

/** The demo's keys. */
const K = VISUALLY_HIDDEN_DEMO_KEYS.demo_free.visually_hidden.icon_context;

/** A heading with context only screen readers hear. */
export default function IconContext() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View accessibilityRole="header">
      <Text className="font-semibold">
        {t(K.heading)}
        <VisuallyHidden>{t(K.context)}</VisuallyHidden>
      </Text>
    </View>
  );
}

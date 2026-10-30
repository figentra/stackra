/**
 * Stackra file contract:
 * Purpose: the "variants" demo of the native Checkbox: `primary` on the page, `secondary` on a surface.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Checkbox, Surface, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { CHECKBOX_DEMO_KEYS } from "#src/demos/free/checkbox/checkbox-demo-keys.constant";

/** The demo's keys. */
const K = CHECKBOX_DEMO_KEYS.demo_free.checkbox.variants;

/** Each variant where it belongs. */
export default function Variants() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      <Checkbox label={t(K.primary)} variant="primary" defaultValue />
      <Surface variant="secondary">
        <Checkbox label={t(K.secondary)} variant="secondary" defaultValue />
      </Surface>
    </View>
  );
}

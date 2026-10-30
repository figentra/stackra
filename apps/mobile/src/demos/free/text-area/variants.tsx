/**
 * Stackra file contract:
 * Purpose: the "variants" demo of the native TextArea: `primary` on the page, `secondary` on a tinted surface.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Surface, TextArea, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TEXT_AREA_DEMO_KEYS } from "#src/demos/free/text-area/text-area-demo-keys.constant";

/** The demo's keys. */
const K = TEXT_AREA_DEMO_KEYS.demo_free.text_area.variants;

/** Each variant where it belongs. */
export default function Variants() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      <TextArea label={t(K.primary)} variant="primary" />
      <Surface variant="secondary">
        <TextArea label={t(K.secondary)} variant="secondary" />
      </Surface>
    </View>
  );
}

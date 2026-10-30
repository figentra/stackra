/**
 * Stackra file contract:
 * Purpose: the "parts" demo of the native TextArea: each part appears only when it is given.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { TextArea, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TEXT_AREA_DEMO_KEYS } from "#src/demos/free/text-area/text-area-demo-keys.constant";

/** The demo's keys. */
const K = TEXT_AREA_DEMO_KEYS.demo_free.text_area.parts;

/** A label, a placeholder, a description. */
export default function Parts() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      <TextArea label={t(K.label_only)} />
      <TextArea label={t(K.with_placeholder)} placeholder={t(K.placeholder)} />
      <TextArea label={t(K.with_description)} description={t(K.hint)} />
    </View>
  );
}

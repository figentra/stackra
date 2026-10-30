/**
 * Stackra file contract:
 * Purpose: the "width" demo of the native TextField: `isFullWidth` is the default; off, it sizes to the content.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { TextField, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TEXT_FIELD_DEMO_KEYS } from "#src/demos/free/text-field/text-field-demo-keys.constant";

/** The demo's keys. */
const K = TEXT_FIELD_DEMO_KEYS.demo_free.text_field.width;

/** Full width, then content width. */
export default function Width() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      <TextField label={t(K.full)} />
      <TextField label={t(K.content)} isFullWidth={false} />
    </View>
  );
}

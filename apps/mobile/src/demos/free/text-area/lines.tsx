/**
 * Stackra file contract:
 * Purpose: the "lines" demo of the native TextArea: `rows` two and six; React Native honours it on Android only.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { TextArea, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TEXT_AREA_DEMO_KEYS } from "#src/demos/free/text-area/text-area-demo-keys.constant";

/** The demo's keys. */
const K = TEXT_AREA_DEMO_KEYS.demo_free.text_area.lines;

/** Two lines, then six. */
export default function Lines() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      <TextArea label={t(K.two)} rows={2} />
      <TextArea label={t(K.six)} rows={6} />
    </View>
  );
}

/**
 * Stackra file contract:
 * Purpose: the "sizes" demo of the native AiMark: `size` `sm` (the default) and `md`.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { AiMark, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { AI_MARK_DEMO_KEYS } from "#src/demos/free/ai-mark/ai-mark-demo-keys.constant";

/** The demo's keys. */
const K = AI_MARK_DEMO_KEYS.demo_free.ai_mark.labels;

/** `sm` and `md`. */
export default function Sizes() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="flex-row items-center gap-4">
      <AiMark kind="capable" label={t(K.capable)} size="sm" />
      <AiMark kind="capable" label={t(K.capable)} size="md" />
    </View>
  );
}

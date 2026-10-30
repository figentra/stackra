/**
 * Stackra file contract:
 * Purpose: the "kinds" demo of the native AiMark: `capable`, `changed` and `generated`; the label is read out even when hidden.
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

/** One mark per kind. */
export default function Kinds() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="flex-row gap-4">
      <AiMark kind="capable" label={t(K.capable)} />
      <AiMark kind="changed" label={t(K.changed)} />
      <AiMark kind="generated" label={t(K.generated)} />
    </View>
  );
}

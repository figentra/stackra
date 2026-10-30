/**
 * Stackra file contract:
 * Purpose: the "shown" demo of the native AiMark: `isLabelVisible` under content shown to customers.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { AiMark, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { AI_MARK_DEMO_KEYS } from "#src/demos/free/ai-mark/ai-mark-demo-keys.constant";

/** The demo's keys. */
const K = AI_MARK_DEMO_KEYS.demo_free.ai_mark;

/** Customers must know an answer is AI: the label is shown. */
export default function Shown() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-1">
      <Text>{t(K.shown.content)}</Text>
      <AiMark kind="generated" label={t(K.labels.generated)} isLabelVisible />
    </View>
  );
}

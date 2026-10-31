/**
 * Stackra file contract:
 * Purpose: the "streaming" demo of the native Reasoning: the trigger shimmers "Thinking…" while the steps arrive.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (component gaps, owner approval 2026-10-31).
 */
import { Reasoning, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { REASONING_DEMO_KEYS } from "#src/demos/free/reasoning/reasoning-demo-keys.constant";

/** The demo's keys. */
const K = REASONING_DEMO_KEYS.demo_free.reasoning.streaming;

/** Reasoning: the trigger shimmers "Thinking…" while the steps arrive. */
export default function Streaming() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View>
      <Reasoning isStreaming defaultExpanded steps={[{ key: "stock", content: t(K.step) }]} />
    </View>
  );
}

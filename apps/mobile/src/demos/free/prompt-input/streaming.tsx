/**
 * Stackra file contract:
 * Purpose: the "streaming" demo of the native PromptInput: send starts a pretend answer, the button turns into Stop, and Stop ends it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (component gaps, owner approval 2026-10-31).
 */
import { PromptInput, Text, useCatalogueText, type PromptInputStatus } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { PROMPT_INPUT_DEMO_KEYS } from "#src/demos/free/prompt-input/prompt-input-demo-keys.constant";

/** The demo's keys. */
const K = PROMPT_INPUT_DEMO_KEYS.demo_free.prompt_input.streaming;

/** PromptInput: send starts a pretend answer, the button turns into Stop, and Stop ends it. */
export default function Streaming() {
  const t = useCatalogueText(MESSAGES.en);
  const [status, setStatus] = useState<PromptInputStatus>("ready");
  return (
    <View className="gap-2">
      <PromptInput
        defaultValue={t(K.value)}
        status={status}
        onSubmit={() => setStatus("streaming")}
        onStop={() => setStatus("ready")}
      />
      <Text type="small" tone="muted">
        {t(K.hint)}
      </Text>
    </View>
  );
}

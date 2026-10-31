/**
 * Stackra file contract:
 * Purpose: the "composer" demo of the native PromptInput: a composer with an attached file, an attach button and a footer.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (component gaps, owner approval 2026-10-31).
 */
import {
  AttachmentCard,
  IconButton,
  PromptInput,
  Text,
  useCatalogueText,
} from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { PROMPT_INPUT_DEMO_KEYS } from "#src/demos/free/prompt-input/prompt-input-demo-keys.constant";

/** The demo's keys. */
const K = PROMPT_INPUT_DEMO_KEYS.demo_free.prompt_input.composer;

/** PromptInput: a composer with an attached file, an attach button and a footer. */
export default function Composer() {
  const t = useCatalogueText(MESSAGES.en);
  const [hasFile, setHasFile] = useState(true);
  const [sent, setSent] = useState("");
  return (
    <View className="gap-2">
      <PromptInput
        onSubmit={(text) => setSent(text)}
        attachments={
          hasFile ? <AttachmentCard name={t(K.file)} onRemove={() => setHasFile(false)} /> : null
        }
        startActions={<IconButton icon="plus" label={t(K.attach)} size="sm" variant="ghost" />}
        footer={t(K.footer)}
      />
      {sent ? (
        <Text type="small" tone="muted">
          {t(K.sent, { text: sent })}
        </Text>
      ) : null}
    </View>
  );
}

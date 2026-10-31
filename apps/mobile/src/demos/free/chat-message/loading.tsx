/**
 * Stackra file contract:
 * Purpose: the "loading" demo of the native ChatMessage: the assistant's turn shimmers "Thinking…" until its first words arrive.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (component gaps, owner approval 2026-10-31).
 */
import { Avatar, ChatMessage, Icon, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { CHAT_MESSAGE_DEMO_KEYS } from "#src/demos/free/chat-message/chat-message-demo-keys.constant";

/** The demo's keys. */
const K = CHAT_MESSAGE_DEMO_KEYS.demo_free.chat_message.loading;

/** ChatMessage: the assistant's turn shimmers "Thinking…" until its first words arrive. */
export default function Loading() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      <ChatMessage from="user">{t(K.question)}</ChatMessage>
      <ChatMessage
        from="assistant"
        isLoading
        avatar={<Avatar size="sm" variant="soft" tone="accent" fallback={<Icon name="sparkles" />} />}
      />
    </View>
  );
}

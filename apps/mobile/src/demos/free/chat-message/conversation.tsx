/**
 * Stackra file contract:
 * Purpose: the "conversation" demo of the native ChatMessage: the person's question with a file, and the assistant's answer with its actions.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (component gaps, owner approval 2026-10-31).
 */
import {
  AttachmentCard,
  Avatar,
  ChatMessage,
  Icon,
  MessageActions,
  useCatalogueText,
} from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { CHAT_MESSAGE_DEMO_KEYS } from "#src/demos/free/chat-message/chat-message-demo-keys.constant";

/** The demo's keys. */
const K = CHAT_MESSAGE_DEMO_KEYS.demo_free.chat_message.conversation;

/** ChatMessage: the person's question with a file, and the assistant's answer with its actions. */
export default function Conversation() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      <ChatMessage
        from="user"
        attachments={<AttachmentCard name={t(K.file)} size={48_213} type="text/csv" />}
      >
        {t(K.question)}
      </ChatMessage>
      <ChatMessage
        from="assistant"
        avatar={
          <Avatar size="sm" variant="soft" tone="accent" fallback={<Icon name="sparkles" />} />
        }
        actions={<MessageActions copyValue={t(K.answer)} onRetry={() => undefined} />}
      >
        {t(K.answer)}
      </ChatMessage>
    </View>
  );
}

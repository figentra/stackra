/**
 * Stackra file contract:
 * Purpose: the page of the ChatConversation route: `@stackra/ui-pro`'s ChatConversation as a scrolling viewport of
 *          user and assistant messages that stays pinned to the newest message, with a named button that jumps back
 *          to the bottom after the reader scrolls up, and a button that adds a message to see it stick.
 * Boundary: presentation only; the messages are local. The viewport has a name and the scroll button its own name.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import { Button } from "@heroui/react";
import * as UiPro from "@stackra/ui-pro/react";
import { useState } from "react";

import { ProChatConversationRoute } from "#src/routes/pro-chat-conversation/pro-chat-conversation.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-chat-conversation.*` keys.
const STRINGS = {
  documentTitle: `${ProChatConversationRoute.title} · Stackra Playground`,
  intro:
    "A message viewport that keeps the newest message in view while a reply streams, and leaves the reader alone once they scroll away. Add a message to see it follow, then scroll up to get the jump button.",
  conversation: "Conversation",
  viewport: "Chat messages",
  scrollButton: "Scroll to the latest message",
  add: "Add a message",
  assistant: "Assistant",
  ai: "AI",
} as const;

/** One message of the conversation. */
interface Message {
  readonly id: number;
  readonly role: "user" | "assistant";
  readonly text: string;
}

const START: readonly Message[] = [
  { id: 1, role: "user", text: "How does auto-scroll work in chat UIs?" },
  {
    id: 2,
    role: "assistant",
    text: "The viewport stays pinned to the latest message while a reply streams in.",
  },
  { id: 3, role: "user", text: "And when I scroll up to read something earlier?" },
  {
    id: 4,
    role: "assistant",
    text: "New content can arrive without snapping the viewport away from what you are reading. A button appears to take you back down.",
  },
  { id: 5, role: "user", text: "What happens when the assistant does several steps?" },
  {
    id: 6,
    role: "assistant",
    text: "The steps and the answer share one scrollable surface, so the whole exchange stays together.",
  },
];

/** The ChatConversation page. */
export function ProChatConversation() {
  const [messages, setMessages] = useState<readonly Message[]>(START);

  const add = () =>
    setMessages((current) => [
      ...current,
      {
        id: current.length + 1,
        role: current.length % 2 === 0 ? "user" : "assistant",
        text: `Message number ${current.length + 1}.`,
      },
    ]);

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProChatConversationRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="conversation-heading" className="grid max-w-2xl gap-3">
        <h2 id="conversation-heading" className="type-h2">
          {STRINGS.conversation}
        </h2>
        <div>
          <Button variant="secondary" onPress={add}>
            {STRINGS.add}
          </Button>
        </div>
        <div className="flex h-80 flex-col overflow-hidden rounded-2xl border border-border">
          <UiPro.ChatConversation className="flex-1" aria-label={STRINGS.viewport}>
            <UiPro.ChatConversation.Content className="flex-col gap-6 p-4">
              {messages.map((message) =>
                message.role === "user" ? (
                  <UiPro.ChatMessage.User key={message.id}>
                    <UiPro.ChatMessage.Bubble>
                      <UiPro.ChatMessage.Content>
                        <bdi>{message.text}</bdi>
                      </UiPro.ChatMessage.Content>
                    </UiPro.ChatMessage.Bubble>
                  </UiPro.ChatMessage.User>
                ) : (
                  <UiPro.ChatMessage.Assistant key={message.id}>
                    <UiPro.ChatMessage.Avatar show alt={STRINGS.assistant} fallback={STRINGS.ai} />
                    <UiPro.ChatMessage.Body>
                      <UiPro.ChatMessage.Content>
                        <bdi>{message.text}</bdi>
                      </UiPro.ChatMessage.Content>
                    </UiPro.ChatMessage.Body>
                  </UiPro.ChatMessage.Assistant>
                ),
              )}
            </UiPro.ChatConversation.Content>
            <UiPro.ChatConversation.ScrollButton label={STRINGS.scrollButton} />
          </UiPro.ChatConversation>
        </div>
      </section>
    </article>
  );
}

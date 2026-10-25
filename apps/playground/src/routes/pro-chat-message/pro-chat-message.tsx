/**
 * Stackra file contract:
 * Purpose: the page of the ChatMessage route: `@stackra-pro/ui`'s ChatMessage as a user turn in a bubble and an assistant
 *          turn with an avatar, a body and a row of icon actions (copy, good response, bad response, regenerate), each
 *          action named for screen readers, and an assistant turn with rendered Markdown.
 * Boundary: presentation only; the messages are local. Message text is isolated (`<bdi>`) so a right-to-left page keeps
 *          mixed text readable.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra-pro/ui/react";

import { DemoIcon, type DemoIconName } from "#src/components/demo-icon";
import { ProChatMessageRoute } from "#src/routes/pro-chat-message/pro-chat-message.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-chat-message.*` keys.
const STRINGS = {
  documentTitle: `${ProChatMessageRoute.title} · Stackra Playground`,
  intro:
    "One turn of a conversation: the user's message in a bubble, the assistant's reply with an avatar, the text or rendered Markdown, and actions beneath it.",
  turns: "A conversation",
  markdown: "With Markdown",
  assistant: "Assistant",
  ai: "AI",
  question:
    "Can you explain how compound components help an AI chat UI stay independent of any SDK?",
  answer:
    "Compound components let you compose the message layout explicitly while your app keeps the state.",
  markdownQuestion: "Show me Markdown inside an assistant message.",
  markdownAnswer:
    "Here is a short answer with **bold text**, a list and some `inline code`:\n\n- The layout is presentation only\n- Your code owns the message array",
} as const;

const ACTIONS: readonly { id: string; label: string; icon: DemoIconName }[] = [
  { id: "copy", label: "Copy the answer", icon: "doc" },
  { id: "good", label: "Good response", icon: "users" },
  { id: "bad", label: "Bad response", icon: "gear" },
  { id: "again", label: "Regenerate the answer", icon: "search" },
];

/** The ChatMessage page. */
export function ProChatMessage() {
  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProChatMessageRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="turns-heading" className="grid max-w-2xl gap-3">
        <h2 id="turns-heading" className="type-h2">
          {STRINGS.turns}
        </h2>
        <div className="flex flex-col gap-6">
          <UiPro.ChatMessage.User>
            <UiPro.ChatMessage.Bubble>
              <UiPro.ChatMessage.Content>
                <bdi>{STRINGS.question}</bdi>
              </UiPro.ChatMessage.Content>
            </UiPro.ChatMessage.Bubble>
          </UiPro.ChatMessage.User>
          <UiPro.ChatMessage.Assistant>
            <UiPro.ChatMessage.Avatar show alt={STRINGS.assistant} fallback={STRINGS.ai} />
            <UiPro.ChatMessage.Body>
              <UiPro.ChatMessage.Content>
                <bdi>{STRINGS.answer}</bdi>
              </UiPro.ChatMessage.Content>
              <UiPro.ChatMessage.Actions>
                {ACTIONS.map((action) => (
                  <UiPro.ChatMessage.Action key={action.id} label={action.label}>
                    <DemoIcon name={action.icon} />
                  </UiPro.ChatMessage.Action>
                ))}
              </UiPro.ChatMessage.Actions>
            </UiPro.ChatMessage.Body>
          </UiPro.ChatMessage.Assistant>
        </div>
      </section>
      <section aria-labelledby="markdown-heading" className="grid max-w-2xl gap-3">
        <h2 id="markdown-heading" className="type-h2">
          {STRINGS.markdown}
        </h2>
        <div className="flex flex-col gap-6">
          <UiPro.ChatMessage.User>
            <UiPro.ChatMessage.Bubble>
              <UiPro.ChatMessage.Content>
                <bdi>{STRINGS.markdownQuestion}</bdi>
              </UiPro.ChatMessage.Content>
            </UiPro.ChatMessage.Bubble>
          </UiPro.ChatMessage.User>
          <UiPro.ChatMessage.Assistant>
            <UiPro.ChatMessage.Avatar show alt={STRINGS.assistant} fallback={STRINGS.ai} />
            <UiPro.ChatMessage.Body>
              <UiPro.ChatMessage.Content>
                <UiPro.Markdown>{STRINGS.markdownAnswer}</UiPro.Markdown>
              </UiPro.ChatMessage.Content>
            </UiPro.ChatMessage.Body>
          </UiPro.ChatMessage.Assistant>
        </div>
      </section>
    </article>
  );
}

/**
 * Stackra file contract:
 * Purpose: the page of the ChatMessageActions route: `@stackra-pro/ui`'s ChatMessageActions as the full row of preset
 *          actions under an assistant message (copy, good response, bad response, regenerate, more) and as a minimal row
 *          (copy and more), each icon-only action named for screen readers.
 * Boundary: presentation only; the actions do nothing. Copy writes to the clipboard in a browser that allows it.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra-pro/ui/react";

import { ProChatMessageActionsRoute } from "#src/routes/pro-chat-message-actions/pro-chat-message-actions.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-chat-message-actions.*` keys.
const STRINGS = {
  documentTitle: `${ProChatMessageActionsRoute.title} · Stackra Playground`,
  intro:
    "Preset actions beneath an assistant message. Each is an icon button with its own name; show all of them or only the few a layout needs.",
  full: "All actions",
  fullText: "Assistant answers can offer quick actions beneath the message body.",
  minimal: "Minimal",
  minimalText: "A compact layout keeps only what it needs.",
  assistant: "Assistant",
  ai: "AI",
  copy: "Copy",
  good: "Good response",
  bad: "Bad response",
  regenerate: "Regenerate",
  more: "More actions",
} as const;

/** The ChatMessageActions page. */
export function ProChatMessageActions() {
  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProChatMessageActionsRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="full-heading" className="grid max-w-2xl gap-3">
        <h2 id="full-heading" className="type-h2">
          {STRINGS.full}
        </h2>
        <UiPro.ChatMessage.Assistant>
          <UiPro.ChatMessage.Avatar show alt={STRINGS.assistant} fallback={STRINGS.ai} />
          <UiPro.ChatMessage.Body>
            <UiPro.ChatMessage.Content>
              <bdi>{STRINGS.fullText}</bdi>
            </UiPro.ChatMessage.Content>
            <UiPro.ChatMessageActions>
              <UiPro.ChatMessageActions.Copy label={STRINGS.copy} />
              <UiPro.ChatMessageActions.ThumbsUp label={STRINGS.good} />
              <UiPro.ChatMessageActions.ThumbsDown label={STRINGS.bad} />
              <UiPro.ChatMessageActions.Regenerate label={STRINGS.regenerate} />
              <UiPro.ChatMessageActions.Menu label={STRINGS.more} />
            </UiPro.ChatMessageActions>
          </UiPro.ChatMessage.Body>
        </UiPro.ChatMessage.Assistant>
      </section>
      <section aria-labelledby="minimal-heading" className="grid max-w-2xl gap-3">
        <h2 id="minimal-heading" className="type-h2">
          {STRINGS.minimal}
        </h2>
        <UiPro.ChatMessage.Assistant>
          <UiPro.ChatMessage.Avatar show alt={STRINGS.assistant} fallback={STRINGS.ai} />
          <UiPro.ChatMessage.Body>
            <UiPro.ChatMessage.Content>
              <bdi>{STRINGS.minimalText}</bdi>
            </UiPro.ChatMessage.Content>
            <UiPro.ChatMessageActions>
              <UiPro.ChatMessageActions.Copy label={STRINGS.copy} />
              <UiPro.ChatMessageActions.Menu label={STRINGS.more} />
            </UiPro.ChatMessageActions>
          </UiPro.ChatMessage.Body>
        </UiPro.ChatMessage.Assistant>
      </section>
    </article>
  );
}

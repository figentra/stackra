/**
 * Stackra file contract:
 * Purpose: the page of the ChatSource route: `@stackra/ui-pro`'s ChatSource as a citation chip for a web page (title, link
 *          and a short description) and for an uploaded document, and ChatSources as a collapsible list of several
 *          sources under a trigger that counts them.
 * Boundary: presentation only; the sources are local and no favicon is fetched, so the page needs no network. A web
 *          source is a link; the trigger of the list is a button that reports its expanded state.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra/ui-pro/react";

import { ProChatSourceRoute } from "#src/routes/pro-chat-source/pro-chat-source.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-chat-source.*` keys.
const STRINGS = {
  documentTitle: `${ProChatSourceRoute.title} · Stackra Playground`,
  intro:
    "Citations for an answer: a chip for one web page or one document, and a collapsible list when an answer rests on several.",
  single: "One source",
  singleText: "Here is an answer backed by a single web source.",
  document: "A document",
  documentText: "This answer used an uploaded document.",
  grouped: "Several sources",
  groupedText: "This answer was put together from several sources.",
  groupedTrigger: "3 sources",
  assistant: "Assistant",
  ai: "AI",
} as const;

/** The ChatSource page. */
export function ProChatSource() {
  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProChatSourceRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="single-heading" className="grid max-w-2xl gap-3">
        <h2 id="single-heading" className="type-h2">
          {STRINGS.single}
        </h2>
        <UiPro.ChatMessage.Assistant>
          <UiPro.ChatMessage.Avatar show alt={STRINGS.assistant} fallback={STRINGS.ai} />
          <UiPro.ChatMessage.Body>
            <UiPro.ChatMessage.Content>
              <bdi>{STRINGS.singleText}</bdi>
            </UiPro.ChatMessage.Content>
            <UiPro.ChatSource
              description="Presentation-only AI chat components for React."
              href="https://heroui.com"
              title="HeroUI Pro"
            />
          </UiPro.ChatMessage.Body>
        </UiPro.ChatMessage.Assistant>
      </section>
      <section aria-labelledby="document-heading" className="grid max-w-2xl gap-3">
        <h2 id="document-heading" className="type-h2">
          {STRINGS.document}
        </h2>
        <UiPro.ChatMessage.Assistant>
          <UiPro.ChatMessage.Avatar show alt={STRINGS.assistant} fallback={STRINGS.ai} />
          <UiPro.ChatMessage.Body>
            <UiPro.ChatMessage.Content>
              <bdi>{STRINGS.documentText}</bdi>
            </UiPro.ChatMessage.Content>
            <UiPro.ChatSource sourceType="document" title="Q3-launch-brief.pdf" />
          </UiPro.ChatMessage.Body>
        </UiPro.ChatMessage.Assistant>
      </section>
      <section aria-labelledby="grouped-heading" className="grid max-w-2xl gap-3">
        <h2 id="grouped-heading" className="type-h2">
          {STRINGS.grouped}
        </h2>
        <UiPro.ChatMessage.Assistant>
          <UiPro.ChatMessage.Avatar show alt={STRINGS.assistant} fallback={STRINGS.ai} />
          <UiPro.ChatMessage.Body>
            <UiPro.ChatMessage.Content>
              <bdi>{STRINGS.groupedText}</bdi>
            </UiPro.ChatMessage.Content>
            <UiPro.ChatSources defaultExpanded={false}>
              <UiPro.ChatSources.Trigger>{STRINGS.groupedTrigger}</UiPro.ChatSources.Trigger>
              <UiPro.ChatSources.Content>
                <UiPro.ChatSources.List>
                  <UiPro.ChatSource href="https://heroui.com" title="HeroUI" />
                  <UiPro.ChatSource
                    description="Slot-based styling in the Pro components."
                    href="https://tailwind-variants.org"
                    title="Tailwind Variants"
                  />
                  <UiPro.ChatSource sourceType="document" title="design-system-audit.pdf" />
                </UiPro.ChatSources.List>
              </UiPro.ChatSources.Content>
            </UiPro.ChatSources>
          </UiPro.ChatMessage.Body>
        </UiPro.ChatMessage.Assistant>
      </section>
    </article>
  );
}

/**
 * Stackra file contract:
 * Purpose: the page of the PromptSuggestion route: `@stackra-pro/ui`'s PromptSuggestion as a header over a list of
 *          suggested prompts, each a button that chooses it (the choice is written below, announced as a status), and as
 *          grouped cards with a title and a description each.
 * Boundary: presentation only; the prompts are local. A list suggestion is a button whose name is its own text; a
 *          card of HeroUI Pro's card layout is a plain card, not a control, so it takes no press.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra-pro/ui/react";
import { useState } from "react";

import { ProPromptSuggestionRoute } from "#src/routes/pro-prompt-suggestion/pro-prompt-suggestion.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-prompt-suggestion.*` keys.
const STRINGS = {
  documentTitle: `${ProPromptSuggestionRoute.title} · Stackra Playground`,
  intro:
    "Starting points for an empty conversation: a short list of prompts to press, or cards that say a little more about each.",
  list: "A list",
  listTitle: "What do you want to work on?",
  listDescription: "Ask a question or start from one of the suggestions below.",
  cards: "Cards",
  cardsTitle: "Starter prompts for everyday work",
  cardsDescription: "Pick one to see the kind of conversation it starts.",
  group: "At work",
  groupDescription: "Planning, updates and communication.",
  chosen: "Chosen",
  none: "Nothing chosen yet.",
} as const;

const PROMPTS = [
  "Draft a weekly project update email for my team",
  "Summarise this meeting transcript into action items",
  "Help me plan a product launch checklist",
  "Write a friendly reply to a customer support ticket",
] as const;

const CARDS = [
  {
    id: "weekly",
    title: "Weekly project update",
    description: "Turn rough notes into a clear update.",
  },
  {
    id: "meeting",
    title: "Meeting summary",
    description: "Capture decisions, owners and next steps.",
  },
  { id: "launch", title: "Launch planning", description: "Outline milestones, risks and tasks." },
] as const;

/** The PromptSuggestion page. */
export function ProPromptSuggestion() {
  const [chosen, setChosen] = useState<string | null>(null);

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProPromptSuggestionRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="list-heading" className="grid max-w-2xl gap-3">
        <h2 id="list-heading" className="type-h2">
          {STRINGS.list}
        </h2>
        <UiPro.PromptSuggestion>
          <UiPro.PromptSuggestion.Header>
            <UiPro.PromptSuggestion.Title>{STRINGS.listTitle}</UiPro.PromptSuggestion.Title>
            <UiPro.PromptSuggestion.Description>
              {STRINGS.listDescription}
            </UiPro.PromptSuggestion.Description>
          </UiPro.PromptSuggestion.Header>
          <UiPro.PromptSuggestion.Items>
            {PROMPTS.map((prompt) => (
              <UiPro.PromptSuggestion.Item key={prompt} onPress={() => setChosen(prompt)}>
                <bdi>{prompt}</bdi>
              </UiPro.PromptSuggestion.Item>
            ))}
          </UiPro.PromptSuggestion.Items>
        </UiPro.PromptSuggestion>
      </section>
      <section aria-labelledby="cards-heading" className="grid max-w-3xl gap-3">
        <h2 id="cards-heading" className="type-h2">
          {STRINGS.cards}
        </h2>
        <UiPro.PromptSuggestion variant="card">
          <UiPro.PromptSuggestion.Header>
            <UiPro.PromptSuggestion.Title>{STRINGS.cardsTitle}</UiPro.PromptSuggestion.Title>
            <UiPro.PromptSuggestion.Description>
              {STRINGS.cardsDescription}
            </UiPro.PromptSuggestion.Description>
          </UiPro.PromptSuggestion.Header>
          <UiPro.PromptSuggestion.Group
            description={STRINGS.groupDescription}
            label={STRINGS.group}
          >
            <UiPro.PromptSuggestion.Items>
              {CARDS.map((card) => (
                <UiPro.PromptSuggestion.Item key={card.id}>
                  <UiPro.PromptSuggestion.ItemTitle>{card.title}</UiPro.PromptSuggestion.ItemTitle>
                  <UiPro.PromptSuggestion.ItemDescription>
                    {card.description}
                  </UiPro.PromptSuggestion.ItemDescription>
                </UiPro.PromptSuggestion.Item>
              ))}
            </UiPro.PromptSuggestion.Items>
          </UiPro.PromptSuggestion.Group>
        </UiPro.PromptSuggestion>
      </section>
      <p className="text-sm" role="status">
        <bdi>
          {STRINGS.chosen}: {chosen ?? STRINGS.none}
        </bdi>
      </p>
    </article>
  );
}

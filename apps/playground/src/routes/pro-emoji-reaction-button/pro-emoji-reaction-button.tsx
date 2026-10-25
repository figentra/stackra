/**
 * Stackra file contract:
 * Purpose: the page of the EmojiReactionButton route: `@stackra-pro/ui`'s EmojiReactionButton as a row of five
 *          reactions, each a toggle named by its meaning that adds or removes the reader's own reaction and its count,
 *          with the totals reported, and a disabled one.
 * Boundary: presentation and local state only. Each button is named by its meaning and the count it shows ("Thumbs
 *          up, 5 reactions"), not by the emoji, since the emoji is decoration to a screen reader and the count is not.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra-pro/ui/react";
import { useState } from "react";

import { ProEmojiReactionButtonRoute } from "#src/routes/pro-emoji-reaction-button/pro-emoji-reaction-button.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-emoji-reaction-button.*` keys.
const STRINGS = {
  documentTitle: `${ProEmojiReactionButtonRoute.title} · Stackra Playground`,
  intro:
    "A reaction button that shows an emoji and how many people used it. Press it to add your reaction and press it again to take it back.",
  reactions: "Reactions",
  total: (count: number, mine: number) => `${count} reactions in total, ${mine} of them yours`,
  disabled: "Disabled",
  named: (label: string, count: number) =>
    `${label}, ${count === 1 ? "1 reaction" : `${count} reactions`}`,
  closed: (named: string) => `${named}, reactions are closed`,
} as const;

const REACTIONS = [
  { id: "heart", emoji: "❤️", label: "Heart", count: 11 },
  { id: "party", emoji: "🎉", label: "Party", count: 1 },
  { id: "thumbs", emoji: "👍", label: "Thumbs up", count: 5 },
  { id: "laugh", emoji: "😂", label: "Laughing", count: 3 },
  { id: "rocket", emoji: "🚀", label: "Rocket", count: 1 },
] as const;

/** The EmojiReactionButton page. */
export function ProEmojiReactionButton() {
  const [mine, setMine] = useState<ReadonlySet<string>>(new Set(["heart"]));
  // `count` is what other people gave; the reader's own is added while it is selected.
  const total = REACTIONS.reduce((sum, reaction) => sum + reaction.count, 0) + mine.size;

  const toggle = (id: string, isSelected: boolean) =>
    setMine((current) => {
      const next = new Set(current);
      if (isSelected) next.add(id);
      else next.delete(id);
      return next;
    });

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProEmojiReactionButtonRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="reactions-heading" className="grid gap-3">
        <h2 id="reactions-heading" className="type-h2">
          {STRINGS.reactions}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {REACTIONS.map((reaction) => {
            const isSelected = mine.has(reaction.id);
            const count = reaction.count + (isSelected ? 1 : 0);
            return (
              <UiPro.EmojiReactionButton
                key={reaction.id}
                label={STRINGS.named(reaction.label, count)}
                isSelected={isSelected}
                onChange={(next) => toggle(reaction.id, next)}
              >
                <UiPro.EmojiReactionButton.Emoji>{reaction.emoji}</UiPro.EmojiReactionButton.Emoji>
                <UiPro.EmojiReactionButton.Count>{count}</UiPro.EmojiReactionButton.Count>
              </UiPro.EmojiReactionButton>
            );
          })}
        </div>
        <p role="status">
          <bdi>{STRINGS.total(total, mine.size)}</bdi>
        </p>
      </section>
      <section aria-labelledby="disabled-heading" className="grid gap-3">
        <h2 id="disabled-heading" className="type-h2">
          {STRINGS.disabled}
        </h2>
        <div>
          <UiPro.EmojiReactionButton label={STRINGS.closed(STRINGS.named("Rocket", 1))} isDisabled>
            <UiPro.EmojiReactionButton.Emoji>🚀</UiPro.EmojiReactionButton.Emoji>
            <UiPro.EmojiReactionButton.Count>1</UiPro.EmojiReactionButton.Count>
          </UiPro.EmojiReactionButton>
        </div>
      </section>
    </article>
  );
}

/**
 * Stackra file contract:
 * Purpose: the page of the HoverCard route: `@stackra/ui-pro`'s HoverCard on a link inside a sentence, opening a card
 *          with a profile preview when the link is hovered or focused, and a second card with a short delay on a
 *          button.
 * Boundary: presentation only. The card is a dialog named by `label`; the link's address is a fragment, so a press
 *          stays on the page.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import { Button, Link } from "@heroui/react";
import * as UiPro from "@stackra/ui-pro/react";

import { ProHoverCardRoute } from "#src/routes/pro-hover-card/pro-hover-card.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-hover-card.*` keys.
const STRINGS = {
  documentTitle: `${ProHoverCardRoute.title} · Stackra Playground`,
  intro:
    "A card that previews more about a link without leaving the page. Hover the link or move focus to it, and the card opens; Escape closes it.",
  inline: "In a sentence",
  before: "Read the design notes by ",
  handle: "@stackra",
  after: " for the reasoning behind the tokens.",
  profile: "Stackra profile",
  name: "Stackra",
  role: "Design system team",
  bio: "Tokens, components and the playground that checks them in light, dark and both directions.",
  following: "Following",
  followers: "Followers",
  followingCount: "42",
  followersCount: "1.2K",
  delayed: "With a delay",
  open: "Release notes",
  notes: "Release notes preview",
  notesText: "Version 1.4 adds the Pro wrappers and their playground pages.",
} as const;

/** The HoverCard page. */
export function ProHoverCard() {
  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProHoverCardRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="inline-heading" className="grid gap-3">
        <h2 id="inline-heading" className="type-h2">
          {STRINGS.inline}
        </h2>
        <p className="max-w-prose leading-8">
          <bdi>{STRINGS.before}</bdi>
          <UiPro.HoverCard>
            <UiPro.HoverCard.Trigger>
              <Link href="#profile">{STRINGS.handle}</Link>
            </UiPro.HoverCard.Trigger>
            <UiPro.HoverCard.Content label={STRINGS.profile}>
              <div className="grid max-w-xs gap-2">
                <div>
                  <p className="font-semibold">{STRINGS.name}</p>
                  <p className="text-sm text-muted">{STRINGS.role}</p>
                </div>
                <p className="text-sm">
                  <bdi>{STRINGS.bio}</bdi>
                </p>
                <p className="flex gap-4 text-sm">
                  <span>
                    <strong>{STRINGS.followingCount}</strong>{" "}
                    <span className="text-muted">{STRINGS.following}</span>
                  </span>
                  <span>
                    <strong>{STRINGS.followersCount}</strong>{" "}
                    <span className="text-muted">{STRINGS.followers}</span>
                  </span>
                </p>
              </div>
            </UiPro.HoverCard.Content>
          </UiPro.HoverCard>
          <bdi>{STRINGS.after}</bdi>
        </p>
      </section>
      <section aria-labelledby="delayed-heading" className="grid gap-3">
        <h2 id="delayed-heading" className="type-h2">
          {STRINGS.delayed}
        </h2>
        <div>
          <UiPro.HoverCard openDelay={600} closeDelay={200}>
            <UiPro.HoverCard.Trigger>
              <Button variant="secondary">{STRINGS.open}</Button>
            </UiPro.HoverCard.Trigger>
            <UiPro.HoverCard.Content label={STRINGS.notes}>
              <p className="max-w-xs text-sm">
                <bdi>{STRINGS.notesText}</bdi>
              </p>
            </UiPro.HoverCard.Content>
          </UiPro.HoverCard>
        </div>
      </section>
    </article>
  );
}

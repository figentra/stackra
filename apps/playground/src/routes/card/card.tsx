/**
 * Stackra file contract:
 * Purpose: the page of the card route: a card at every surface level, the full anatomy, title levels with a nested
 *          card, a card named as an article by its title, a horizontal card and a dismissible one, all from
 *          `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. Titles sit at the default level
 *          3 under each section's level 2, so the outline has no gap.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0304; WCAG 2.2 SC 1.3.1; ADR 0060
 *          (light, dark, RTL).
 */
import { SurfaceVariant } from "@stackra/ui/contracts";
import { Button, Card as UiCard, CloseButton, Heading, Text } from "@stackra/ui/react";
import { useState } from "react";

import { PageSection } from "#src/components/page-section";
import { CardRoute } from "#src/routes/card/card.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::card.*` keys.
const STRINGS = {
  documentTitle: `${CardRoute.title} · Stackra Playground`,
  intro:
    "A Card is a surface with padding, radius and the theme's surface shadow, holding a header, a title, a description, content and a footer. It is a container, never a press target: put a link or a button inside it.",
  levels: "Levels",
  levelsNote:
    "One card per surface level. The transparent card drops the background and the shadow.",
  levelTitle: (level: string) => `Level ${level}`,
  levelDescription: "A short description under the title.",
  levelContent: "The content of the card.",
  anatomy: "Anatomy",
  anatomyNote: "Header with title and description, content, and a footer with the actions.",
  anatomyTitle: "Invoice 1042",
  anatomyDescription: "Due on the first of next month.",
  anatomyContent: "Three line items, one reminder sent, no payment yet.",
  pay: "Pay now",
  later: "Remind me later",
  titleLevels: "Title levels",
  titleLevelsNote:
    "The title's level is its place in the outline, level 3 here, and level 4 for the card inside it. The look stays the card title's.",
  outerTitle: "Subscription",
  outerDescription: "Your plan and what it includes.",
  innerTitle: "Add-ons",
  innerContent: "Two add-ons are active.",
  named: "Named card",
  namedNote: "The card is an article, named by its title through aria-labelledby.",
  namedTitle: "Release notes",
  namedContent: "A screen reader announces this card as an article called Release notes.",
  horizontal: "Horizontal",
  horizontalNote: "On wide screens the content sits beside a decorative block.",
  horizontalTitle: "Weekly digest",
  horizontalContent: "A summary of what changed this week.",
  dismissible: "Dismissible",
  dismissibleNote: "Dismiss the card to hide it; Show again brings it back.",
  dismissibleTitle: "Your changes were saved",
  dismissibleContent: "You can close this card at any time.",
  dismiss: "Dismiss card",
  showAgain: "Show again",
  hidden: "The card is hidden.",
} as const;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-4";

/** The Card page. */
export function Card() {
  const [isShown, setIsShown] = useState(true);

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Heading level={1}>{CardRoute.title}</Heading>
        <Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Text>
      </header>

      <PageSection id="card-levels" title={STRINGS.levels} note={STRINGS.levelsNote}>
        <div className="grid gap-4 sm:grid-cols-2">
          {SurfaceVariant.map((variant) => (
            <UiCard
              key={variant}
              variant={variant}
              className={variant === "transparent" ? "border border-border" : ""}
            >
              <UiCard.Header>
                <UiCard.Title>{STRINGS.levelTitle(variant)}</UiCard.Title>
                <UiCard.Description>
                  <bdi>{STRINGS.levelDescription}</bdi>
                </UiCard.Description>
              </UiCard.Header>
              <UiCard.Content>
                <bdi>{STRINGS.levelContent}</bdi>
              </UiCard.Content>
            </UiCard>
          ))}
        </div>
      </PageSection>

      <PageSection id="card-anatomy" title={STRINGS.anatomy} note={STRINGS.anatomyNote}>
        <UiCard className="max-w-sm">
          <UiCard.Header>
            <UiCard.Title>{STRINGS.anatomyTitle}</UiCard.Title>
            <UiCard.Description>
              <bdi>{STRINGS.anatomyDescription}</bdi>
            </UiCard.Description>
          </UiCard.Header>
          <UiCard.Content>
            <bdi>{STRINGS.anatomyContent}</bdi>
          </UiCard.Content>
          <UiCard.Footer className="gap-2">
            <Button variant="primary">{STRINGS.pay}</Button>
            <Button variant="secondary">{STRINGS.later}</Button>
          </UiCard.Footer>
        </UiCard>
      </PageSection>

      <PageSection
        id="card-title-levels"
        title={STRINGS.titleLevels}
        note={STRINGS.titleLevelsNote}
      >
        <UiCard className="max-w-md">
          <UiCard.Header>
            <UiCard.Title level={3}>{STRINGS.outerTitle}</UiCard.Title>
            <UiCard.Description>
              <bdi>{STRINGS.outerDescription}</bdi>
            </UiCard.Description>
          </UiCard.Header>
          <UiCard.Content>
            <UiCard variant="transparent" className="border border-border">
              <UiCard.Title level={4}>{STRINGS.innerTitle}</UiCard.Title>
              <UiCard.Content>
                <bdi>{STRINGS.innerContent}</bdi>
              </UiCard.Content>
            </UiCard>
          </UiCard.Content>
        </UiCard>
      </PageSection>

      <PageSection id="card-named" title={STRINGS.named} note={STRINGS.namedNote}>
        <UiCard role="article" aria-labelledby="card-named-title" className="max-w-sm">
          <UiCard.Header>
            <UiCard.Title id="card-named-title">{STRINGS.namedTitle}</UiCard.Title>
          </UiCard.Header>
          <UiCard.Content>
            <bdi>{STRINGS.namedContent}</bdi>
          </UiCard.Content>
        </UiCard>
      </PageSection>

      <PageSection id="card-horizontal" title={STRINGS.horizontal} note={STRINGS.horizontalNote}>
        <UiCard className="max-w-xl md:flex-row md:items-center">
          <div
            aria-hidden="true"
            className="h-24 rounded-2xl bg-default md:h-24 md:w-40 md:shrink-0"
          />
          <UiCard.Content>
            <UiCard.Title>{STRINGS.horizontalTitle}</UiCard.Title>
            <UiCard.Description>
              <bdi>{STRINGS.horizontalContent}</bdi>
            </UiCard.Description>
          </UiCard.Content>
        </UiCard>
      </PageSection>

      <PageSection id="card-dismissible" title={STRINGS.dismissible} note={STRINGS.dismissibleNote}>
        <div className="grid max-w-sm gap-3">
          {isShown ? (
            <UiCard>
              <CloseButton
                label={STRINGS.dismiss}
                className="absolute end-3 top-3"
                onPress={() => setIsShown(false)}
              />
              <UiCard.Header>
                <UiCard.Title>{STRINGS.dismissibleTitle}</UiCard.Title>
              </UiCard.Header>
              <UiCard.Content>
                <bdi>{STRINGS.dismissibleContent}</bdi>
              </UiCard.Content>
            </UiCard>
          ) : (
            <div className={ROW}>
              <Text role="status" tone="muted">
                <bdi>{STRINGS.hidden}</bdi>
              </Text>
              <Button variant="secondary" onPress={() => setIsShown(true)}>
                {STRINGS.showAgain}
              </Button>
            </div>
          )}
        </div>
      </PageSection>
    </article>
  );
}

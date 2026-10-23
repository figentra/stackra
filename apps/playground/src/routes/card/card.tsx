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
import * as Ui from "@stackra/ui/react";
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
        <Ui.Heading level={1}>{CardRoute.title}</Ui.Heading>
        <Ui.Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Ui.Text>
      </header>

      <PageSection id="card-levels" title={STRINGS.levels} note={STRINGS.levelsNote}>
        <div className="grid gap-4 sm:grid-cols-2">
          {SurfaceVariant.map((variant) => (
            <Ui.Card
              key={variant}
              variant={variant}
              className={variant === "transparent" ? "border border-border" : ""}
            >
              <Ui.Card.Header>
                <Ui.Card.Title>{STRINGS.levelTitle(variant)}</Ui.Card.Title>
                <Ui.Card.Description>
                  <bdi>{STRINGS.levelDescription}</bdi>
                </Ui.Card.Description>
              </Ui.Card.Header>
              <Ui.Card.Content>
                <bdi>{STRINGS.levelContent}</bdi>
              </Ui.Card.Content>
            </Ui.Card>
          ))}
        </div>
      </PageSection>

      <PageSection id="card-anatomy" title={STRINGS.anatomy} note={STRINGS.anatomyNote}>
        <Ui.Card className="max-w-sm">
          <Ui.Card.Header>
            <Ui.Card.Title>{STRINGS.anatomyTitle}</Ui.Card.Title>
            <Ui.Card.Description>
              <bdi>{STRINGS.anatomyDescription}</bdi>
            </Ui.Card.Description>
          </Ui.Card.Header>
          <Ui.Card.Content>
            <bdi>{STRINGS.anatomyContent}</bdi>
          </Ui.Card.Content>
          <Ui.Card.Footer className="gap-2">
            <Ui.Button variant="primary">{STRINGS.pay}</Ui.Button>
            <Ui.Button variant="secondary">{STRINGS.later}</Ui.Button>
          </Ui.Card.Footer>
        </Ui.Card>
      </PageSection>

      <PageSection
        id="card-title-levels"
        title={STRINGS.titleLevels}
        note={STRINGS.titleLevelsNote}
      >
        <Ui.Card className="max-w-md">
          <Ui.Card.Header>
            <Ui.Card.Title level={3}>{STRINGS.outerTitle}</Ui.Card.Title>
            <Ui.Card.Description>
              <bdi>{STRINGS.outerDescription}</bdi>
            </Ui.Card.Description>
          </Ui.Card.Header>
          <Ui.Card.Content>
            <Ui.Card variant="transparent" className="border border-border">
              <Ui.Card.Title level={4}>{STRINGS.innerTitle}</Ui.Card.Title>
              <Ui.Card.Content>
                <bdi>{STRINGS.innerContent}</bdi>
              </Ui.Card.Content>
            </Ui.Card>
          </Ui.Card.Content>
        </Ui.Card>
      </PageSection>

      <PageSection id="card-named" title={STRINGS.named} note={STRINGS.namedNote}>
        <Ui.Card role="article" aria-labelledby="card-named-title" className="max-w-sm">
          <Ui.Card.Header>
            <Ui.Card.Title id="card-named-title">{STRINGS.namedTitle}</Ui.Card.Title>
          </Ui.Card.Header>
          <Ui.Card.Content>
            <bdi>{STRINGS.namedContent}</bdi>
          </Ui.Card.Content>
        </Ui.Card>
      </PageSection>

      <PageSection id="card-horizontal" title={STRINGS.horizontal} note={STRINGS.horizontalNote}>
        <Ui.Card className="max-w-xl md:flex-row md:items-center">
          <div
            aria-hidden="true"
            className="h-24 rounded-2xl bg-default md:h-24 md:w-40 md:shrink-0"
          />
          <Ui.Card.Content>
            <Ui.Card.Title>{STRINGS.horizontalTitle}</Ui.Card.Title>
            <Ui.Card.Description>
              <bdi>{STRINGS.horizontalContent}</bdi>
            </Ui.Card.Description>
          </Ui.Card.Content>
        </Ui.Card>
      </PageSection>

      <PageSection id="card-dismissible" title={STRINGS.dismissible} note={STRINGS.dismissibleNote}>
        <div className="grid max-w-sm gap-3">
          {isShown ? (
            <Ui.Card>
              <Ui.CloseButton
                label={STRINGS.dismiss}
                className="absolute end-3 top-3"
                onPress={() => setIsShown(false)}
              />
              <Ui.Card.Header>
                <Ui.Card.Title>{STRINGS.dismissibleTitle}</Ui.Card.Title>
              </Ui.Card.Header>
              <Ui.Card.Content>
                <bdi>{STRINGS.dismissibleContent}</bdi>
              </Ui.Card.Content>
            </Ui.Card>
          ) : (
            <div className={ROW}>
              <Ui.Text role="status" tone="muted">
                <bdi>{STRINGS.hidden}</bdi>
              </Ui.Text>
              <Ui.Button variant="secondary" onPress={() => setIsShown(true)}>
                {STRINGS.showAgain}
              </Ui.Button>
            </div>
          )}
        </div>
      </PageSection>
    </article>
  );
}

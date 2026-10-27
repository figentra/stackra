/**
 * Stackra file contract:
 * Purpose: the page of the close-button route: the default CloseButton, one with an icon of its own, a disabled one,
 *          and one inside a `Card` whose dismissal hides the card and a Button restores it, all from
 *          `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. Icons are drawn by name
 *          through `Icon`, from the registry in `components/playground-icons` (ADR 0303 decision 10).
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decisions 3 and 7); WCAG 2.2 SC 4.1.2 and 2.5.8.
 */
import { Button, Card, CloseButton as UiCloseButton, Heading, Icon, Text } from "@stackra/ui/react";
import { useState } from "react";

import { PageSection } from "#src/components/page-section";
import { CloseButtonRoute } from "#src/routes/close-button/close-button.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::close-button.*` keys.
const STRINGS = {
  documentTitle: `${CloseButtonRoute.title} · Stackra Playground`,
  intro:
    "CloseButton is the dismiss control for overlays, banners and chips. HeroUI's own default name is the English word Close, so the label is required and set in the app's language.",
  forms: "Forms",
  formsNote: "The default mark, an icon of your own, and the disabled state.",
  default: "Close",
  custom: "Dismiss with a custom icon",
  disabled: "Close (disabled)",
  card: "In use",
  cardNote: "Dismiss the notice to hide it; Show again brings it back.",
  noticeTitle: "Your changes were saved",
  noticeBody: "You can close this notice at any time.",
  dismiss: "Dismiss notice",
  showAgain: "Show again",
  hidden: "The notice is hidden.",
} as const;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-4";

/** The CloseButton page. */
export function CloseButton() {
  const [isShown, setIsShown] = useState(true);

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Heading level={1}>{CloseButtonRoute.title}</Heading>
        <Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Text>
      </header>

      <PageSection id="close-button-forms" title={STRINGS.forms} note={STRINGS.formsNote}>
        <ul className={ROW}>
          <li>
            <UiCloseButton label={STRINGS.default} />
          </li>
          <li>
            <UiCloseButton label={STRINGS.custom} icon={<Icon name="circle-x" size="sm" />} />
          </li>
          <li>
            <UiCloseButton label={STRINGS.disabled} isDisabled />
          </li>
        </ul>
      </PageSection>

      <PageSection id="close-button-use" title={STRINGS.card} note={STRINGS.cardNote}>
        <div className="grid max-w-sm gap-3">
          {isShown ? (
            <Card>
              <UiCloseButton
                label={STRINGS.dismiss}
                className="absolute end-3 top-3"
                onPress={() => setIsShown(false)}
              />
              <Card.Header>
                <Card.Title>{STRINGS.noticeTitle}</Card.Title>
                <Card.Description>
                  <bdi>{STRINGS.noticeBody}</bdi>
                </Card.Description>
              </Card.Header>
            </Card>
          ) : (
            <>
              <Text role="status" tone="muted">
                <bdi>{STRINGS.hidden}</bdi>
              </Text>
              <div>
                <Button variant="secondary" onPress={() => setIsShown(true)}>
                  {STRINGS.showAgain}
                </Button>
              </div>
            </>
          )}
        </div>
      </PageSection>
    </article>
  );
}

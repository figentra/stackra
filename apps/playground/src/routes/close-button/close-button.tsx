/**
 * Stackra file contract:
 * Purpose: the page of the close-button route: the default CloseButton, one with an icon of its own, a disabled one,
 *          and one inside a `Card` whose dismissal hides the card and a Button restores it, all from
 *          `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. Icons are drawn by name
 *          through `Ui.Icon`, from the registry in `components/playground-icons` (ADR 0303 decision 10).
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decisions 3 and 7); WCAG 2.2 SC 4.1.2 and 2.5.8.
 */
import * as Ui from "@stackra/ui/react";
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
        <Ui.Heading level={1}>{CloseButtonRoute.title}</Ui.Heading>
        <Ui.Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Ui.Text>
      </header>

      <PageSection id="close-button-forms" title={STRINGS.forms} note={STRINGS.formsNote}>
        <ul className={ROW}>
          <li>
            <Ui.CloseButton label={STRINGS.default} />
          </li>
          <li>
            <Ui.CloseButton label={STRINGS.custom} icon={<Ui.Icon name="circle-x" size="sm" />} />
          </li>
          <li>
            <Ui.CloseButton label={STRINGS.disabled} isDisabled />
          </li>
        </ul>
      </PageSection>

      <PageSection id="close-button-use" title={STRINGS.card} note={STRINGS.cardNote}>
        <div className="grid max-w-sm gap-3">
          {isShown ? (
            <Ui.Card>
              <Ui.CloseButton
                label={STRINGS.dismiss}
                className="absolute end-3 top-3"
                onPress={() => setIsShown(false)}
              />
              <Ui.Card.Header>
                <Ui.Card.Title>{STRINGS.noticeTitle}</Ui.Card.Title>
                <Ui.Card.Description>
                  <bdi>{STRINGS.noticeBody}</bdi>
                </Ui.Card.Description>
              </Ui.Card.Header>
            </Ui.Card>
          ) : (
            <>
              <Ui.Text role="status" tone="muted">
                <bdi>{STRINGS.hidden}</bdi>
              </Ui.Text>
              <div>
                <Ui.Button variant="secondary" onPress={() => setIsShown(true)}>
                  {STRINGS.showAgain}
                </Ui.Button>
              </div>
            </>
          )}
        </div>
      </PageSection>
    </article>
  );
}

/**
 * Stackra file contract:
 * Purpose: the page of the navigation-header route: the compact header of one screen with each part (title only, a back
 *          button, a back link, start and end slots, a long title that shortens, a large title), an Arabic header in a
 *          right-to-left block, and a live header whose back button, action button and large-title switch report what
 *          they did, all from `@stackra/ui/react` with real props. The page says that this is the web form (a plain
 *          header with a back control) and that the phone form, drawn by the navigator, is native.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n, text in another language carries
 *           its own `lang`. A real screen's header title is its page `h1`; each sample sits under a section's `h2`, so it
 *           takes `headingLevel={3}` and the page keeps its one `h1`. Each header sits in a box inside this page's `main`,
 *           so none is a banner landmark and none takes a `label`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0314 (decisions 4, 5 and 7); ADR 0060
 *          (right-to-left); WCAG 2.2 SC 1.3.1, 2.4.6, 2.5.8 and 4.1.3.
 */
import * as Ui from "@stackra/ui/react";
import { useState, type ReactNode } from "react";

import { PageSection } from "#src/components/page-section";
import { NavigationHeaderRoute } from "#src/routes/navigation-header/navigation-header.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::navigation-header.*` keys.
const STRINGS = {
  documentTitle: `${NavigationHeaderRoute.title} · Stackra Playground`,
  intro:
    "The navigation header is the compact header of one screen: a back button, a title, and slots at the start and the end for the screen's actions. On a phone the navigator draws it above the screen, with an optional large title under the bar. On the web it is a plain header with the same props. Its title is the page's main heading, so a page holds this or a page header, not both; here every sample sits under a section heading, so each takes level 3.",
  parts: "Parts",
  partsNote:
    "From the start of the bar: back button, start slot, title, end slot. The title takes the room left over, so the end slot stays at the end.",
  titleOnly: "Title only",
  backButton: "With a back button",
  backLink: "With a back link",
  slots: "Start and end slots",
  long: "A long title shortens",
  longTitle: "Order 10482 from Acme Wholesale Distribution and Fulfilment Services International",
  large: "A large title",
  arabic: "Arabic",
  arabicNote:
    "A right-to-left header: the back button is at the right and its chevron points the other way, and the whole row mirrors with no side written in the component.",
  live: "Try it",
  liveNote:
    "Press the back button and the action, and switch the large title. The page reports each one below the header.",
  title: "Orders",
  orderTitle: "Order 10482",
  back: "Back",
  backHome: "Back to home",
  notifications: "Notifications",
  add: "Add order",
  largeSwitch: "Large title",
  backStatus: (count: number) =>
    count === 0
      ? "Back not pressed yet."
      : count === 1
        ? "Back pressed once."
        : `Back pressed ${count} times.`,
  actionStatus: (count: number) =>
    count === 0
      ? "No orders added yet."
      : count === 1
        ? "1 order added."
        : `${count} orders added.`,
  titleStatus: (isLarge: boolean) =>
    isLarge ? "The title is large, under the bar." : "The title is compact, in the bar.",
  arabicTitle: "الطلبات",
  arabicBack: "رجوع",
  arabicNotifications: "الإشعارات",
} as const;

/** The box a header sits in, as a screen would hold it. */
const BOX = "overflow-hidden rounded-xl border border-border";

/** The grid that lays the samples out in one column of cards. */
const GRID = "grid gap-4";

/** A caption and the sample it describes, as one list item. */
function Sample({
  caption,
  className,
  children,
}: {
  readonly caption: string;
  readonly className?: string;
  readonly children: ReactNode;
}) {
  return (
    <li className="grid content-start gap-2">
      <Ui.Text tone="muted" type="small">
        {caption}
      </Ui.Text>
      <div className={[BOX, className].filter(Boolean).join(" ")}>{children}</div>
    </li>
  );
}

/** A back handler that does nothing: the parts samples only show the button. */
const noop = () => undefined;

/** The NavigationHeader page. */
export function NavigationHeader() {
  const [backCount, setBackCount] = useState(0);
  const [added, setAdded] = useState(0);
  const [isLarge, setIsLarge] = useState(false);

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Ui.Heading level={1}>{NavigationHeaderRoute.title}</Ui.Heading>
        <Ui.Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Ui.Text>
      </header>

      <PageSection id="navigation-header-parts" title={STRINGS.parts} note={STRINGS.partsNote}>
        <ul className={GRID}>
          <Sample caption={STRINGS.titleOnly}>
            <Ui.NavigationHeader headingLevel={3} title={STRINGS.title} />
          </Sample>
          <Sample caption={STRINGS.backButton}>
            <Ui.NavigationHeader headingLevel={3} title={STRINGS.orderTitle} onBack={noop} />
          </Sample>
          <Sample caption={STRINGS.backLink}>
            <Ui.NavigationHeader
              headingLevel={3}
              title={STRINGS.orderTitle}
              backHref="/"
              backLabel={STRINGS.backHome}
            />
          </Sample>
          <Sample caption={STRINGS.slots}>
            <Ui.NavigationHeader
              headingLevel={3}
              title={STRINGS.title}
              onBack={noop}
              startContent={<Ui.Avatar name="Ada Lovelace" size="sm" />}
              endContent={
                <>
                  <Ui.IconButton icon="bell" label={STRINGS.notifications} variant="ghost" />
                  <Ui.IconButton icon="plus" label={STRINGS.add} variant="ghost" />
                </>
              }
            />
          </Sample>
          <Sample caption={STRINGS.long} className="max-w-sm">
            <Ui.NavigationHeader
              headingLevel={3}
              title={STRINGS.longTitle}
              onBack={noop}
              endContent={<Ui.IconButton icon="plus" label={STRINGS.add} variant="ghost" />}
            />
          </Sample>
          <Sample caption={STRINGS.large}>
            <Ui.NavigationHeader
              headingLevel={3}
              title={STRINGS.title}
              hasLargeTitle
              onBack={noop}
              endContent={<Ui.IconButton icon="plus" label={STRINGS.add} variant="ghost" />}
            />
          </Sample>
        </ul>
      </PageSection>

      <PageSection id="navigation-header-arabic" title={STRINGS.arabic} note={STRINGS.arabicNote}>
        <div dir="rtl" lang="ar" data-sample="arabic" className={BOX}>
          <Ui.NavigationHeader
            headingLevel={3}
            title={STRINGS.arabicTitle}
            onBack={noop}
            backLabel={STRINGS.arabicBack}
            endContent={
              <Ui.IconButton icon="bell" label={STRINGS.arabicNotifications} variant="ghost" />
            }
          />
        </div>
      </PageSection>

      <PageSection id="navigation-header-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <div className="grid gap-3">
          <Ui.Switch label={STRINGS.largeSwitch} value={isLarge} onChange={setIsLarge} />
          <div className={BOX} data-sample="live">
            <Ui.NavigationHeader
              headingLevel={3}
              title={STRINGS.title}
              hasLargeTitle={isLarge}
              onBack={() => setBackCount((count) => count + 1)}
              endContent={
                <Ui.IconButton
                  icon="plus"
                  label={STRINGS.add}
                  variant="ghost"
                  onPress={() => setAdded((count) => count + 1)}
                />
              }
            />
          </div>
          <div className="grid gap-1" data-sample="live-status">
            <Ui.Text role="status" tone="muted">
              {STRINGS.backStatus(backCount)}
            </Ui.Text>
            <Ui.Text role="status" tone="muted">
              {STRINGS.actionStatus(added)}
            </Ui.Text>
            <Ui.Text role="status" tone="muted">
              {STRINGS.titleStatus(isLarge)}
            </Ui.Text>
          </div>
        </div>
      </PageSection>
    </article>
  );
}

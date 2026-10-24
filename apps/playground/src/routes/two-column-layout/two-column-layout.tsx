/**
 * Stackra file contract:
 * Purpose: the page of the two-column-layout route: the default layout (side column beside the main one from 1024 px,
 *          under it below), the layouts that collapse at `md` and at `xl`, an Arabic layout in a right-to-left block
 *          where the side column mirrors to the left, and a live layout with a switch that adds a section to the side
 *          column, all from `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n, text in another language carries
 *           its own `lang`. A layout collapses by the viewport's width (a Tailwind breakpoint), not its box's, so resize
 *           the window to see the side column move. The page's own `h1` is a Heading; the sections are level-3 headings
 *           under the sections' level-2 headings, so the page keeps its one `h1` and no skipped level. Every section's
 *           title is unique, so each region has its own name (axe `landmark-unique`); the layout draws no landmark of
 *           its own.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0317 (decisions 1 and 6); ADR 0060
 *          (right-to-left); WCAG 2.2 SC 1.3.1, 1.3.2, 1.4.10 and 4.1.3.
 */
import type { LayoutBreakpoint } from "@stackra/ui/contracts";
import * as Ui from "@stackra/ui/react";
import { useState, type ReactNode } from "react";

import { PageSection } from "#src/components/page-section";
import { TwoColumnLayoutRoute } from "#src/routes/two-column-layout/two-column-layout.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::two-column-layout.*` keys.
const STRINGS = {
  documentTitle: `${TwoColumnLayoutRoute.title} · Stackra Playground`,
  intro:
    "The two column layout is the frame of a detail page with a main column and a side column. From the collapse breakpoint up the side column sits beside the main one, at the end of the line; below it the side column stacks under the main one. The main column always comes first in the reading and tab order.",
  byDefault: "Default",
  byDefaultNote:
    "The default collapse breakpoint is lg: from 1024 px the side column is beside the main one, below that it is under it. Resize the window to see both.",
  defaultCaption: "Collapses below 1024 px",
  breakpoints: "Collapse breakpoints",
  breakpointsNote:
    "collapseBelow names a Tailwind breakpoint: md is 768 px, xl is 1280 px. Between them, one of these layouts is stacked while the other is not.",
  mdCaption: "Collapses below 768 px",
  xlCaption: "Collapses below 1280 px",
  arabic: "Arabic",
  arabicNote:
    "A right-to-left layout: the main column is at the right and the side column mirrors to the left.",
  live: "Try it",
  liveNote: "The switch adds a history section to the side column. The main column does not move.",
  historySwitch: "Show the history",
  order: "Order",
  orderBody: "Order 1042, placed on 3 March",
  items: "Items",
  itemsBody: "Three items, shipped together",
  summary: "Summary",
  summaryBody: "EUR 128.00, paid",
  history: "History",
  historyBody: "Created, paid and shipped",
  mdMain: "Order at md",
  mdAside: "Summary at md",
  xlMain: "Order at xl",
  xlAside: "Summary at xl",
  liveMain: "Live order",
  liveSummary: "Live summary",
  liveHistory: "Live history",
  mainBody: "The main column.",
  asideBody: "The side column.",
  arabicMain: "الطلب",
  arabicMainBody: "الطلب 1042، تم في 3 مارس",
  arabicAside: "الملخص",
  arabicAsideBody: "128.00 يورو، مدفوع",
  historyStatus: (isShown: boolean) =>
    isShown ? "The history is in the side column." : "The side column holds the summary only.",
} as const;

/** The box a layout sits in, so its edges show. */
const BOX = "rounded-xl border border-border p-4";

/** A caption above the box a layout sits in. */
function Sample({
  caption,
  children,
  sample,
}: {
  readonly caption: string;
  readonly children: ReactNode;
  readonly sample: string;
}) {
  return (
    <div className="grid content-start gap-2">
      <Ui.Text tone="muted" type="small">
        {caption}
      </Ui.Text>
      <div className={BOX} data-sample={sample}>
        {children}
      </div>
    </div>
  );
}

/** One main column and one side column that collapse at `collapseBelow`. */
function Collapsing({
  collapseBelow,
  main,
  aside,
}: {
  readonly collapseBelow: LayoutBreakpoint;
  readonly main: string;
  readonly aside: string;
}) {
  return (
    <Ui.TwoColumnLayout
      collapseBelow={collapseBelow}
      aside={
        <Ui.Section headingLevel={3} title={aside}>
          <Ui.Text>{STRINGS.asideBody}</Ui.Text>
        </Ui.Section>
      }
    >
      <Ui.Section headingLevel={3} title={main}>
        <Ui.Text>{STRINGS.mainBody}</Ui.Text>
      </Ui.Section>
    </Ui.TwoColumnLayout>
  );
}

/** The TwoColumnLayout page. */
export function TwoColumnLayout() {
  const [isHistoryShown, setIsHistoryShown] = useState(false);

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Ui.Heading level={1}>{TwoColumnLayoutRoute.title}</Ui.Heading>
        <Ui.Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Ui.Text>
      </header>

      <PageSection
        id="two-column-layout-default"
        title={STRINGS.byDefault}
        note={STRINGS.byDefaultNote}
      >
        <Sample caption={STRINGS.defaultCaption} sample="default">
          <Ui.TwoColumnLayout
            aside={
              <>
                <Ui.Section headingLevel={3} title={STRINGS.summary}>
                  <Ui.Text>{STRINGS.summaryBody}</Ui.Text>
                </Ui.Section>
                <Ui.Section headingLevel={3} title={STRINGS.history}>
                  <Ui.Text>{STRINGS.historyBody}</Ui.Text>
                </Ui.Section>
              </>
            }
          >
            <Ui.Section headingLevel={3} title={STRINGS.order}>
              <Ui.Text>{STRINGS.orderBody}</Ui.Text>
            </Ui.Section>
            <Ui.Section headingLevel={3} title={STRINGS.items}>
              <Ui.Text>{STRINGS.itemsBody}</Ui.Text>
            </Ui.Section>
          </Ui.TwoColumnLayout>
        </Sample>
      </PageSection>

      <PageSection
        id="two-column-layout-breakpoints"
        title={STRINGS.breakpoints}
        note={STRINGS.breakpointsNote}
      >
        <div className="grid gap-6">
          <Sample caption={STRINGS.mdCaption} sample="md">
            <Collapsing collapseBelow="md" main={STRINGS.mdMain} aside={STRINGS.mdAside} />
          </Sample>
          <Sample caption={STRINGS.xlCaption} sample="xl">
            <Collapsing collapseBelow="xl" main={STRINGS.xlMain} aside={STRINGS.xlAside} />
          </Sample>
        </div>
      </PageSection>

      <PageSection id="two-column-layout-arabic" title={STRINGS.arabic} note={STRINGS.arabicNote}>
        <div dir="rtl" lang="ar" className={BOX} data-sample="arabic">
          <Ui.TwoColumnLayout
            aside={
              <Ui.Section headingLevel={3} title={STRINGS.arabicAside}>
                <Ui.Text>{STRINGS.arabicAsideBody}</Ui.Text>
              </Ui.Section>
            }
          >
            <Ui.Section headingLevel={3} title={STRINGS.arabicMain}>
              <Ui.Text>{STRINGS.arabicMainBody}</Ui.Text>
            </Ui.Section>
          </Ui.TwoColumnLayout>
        </div>
      </PageSection>

      <PageSection id="two-column-layout-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <div className="grid gap-3">
          <Ui.Switch
            label={STRINGS.historySwitch}
            value={isHistoryShown}
            onChange={setIsHistoryShown}
          />
          <div className={BOX} data-sample="live">
            <Ui.TwoColumnLayout
              aside={
                <>
                  <Ui.Section headingLevel={3} title={STRINGS.liveSummary}>
                    <Ui.Text>{STRINGS.summaryBody}</Ui.Text>
                  </Ui.Section>
                  {isHistoryShown ? (
                    <Ui.Section headingLevel={3} title={STRINGS.liveHistory}>
                      <Ui.Text>{STRINGS.historyBody}</Ui.Text>
                    </Ui.Section>
                  ) : null}
                </>
              }
            >
              <Ui.Section headingLevel={3} title={STRINGS.liveMain}>
                <Ui.Text>{STRINGS.orderBody}</Ui.Text>
              </Ui.Section>
            </Ui.TwoColumnLayout>
          </div>
          <Ui.Text role="status" tone="muted" data-sample="live-status">
            {STRINGS.historyStatus(isHistoryShown)}
          </Ui.Text>
        </div>
      </PageSection>
    </article>
  );
}

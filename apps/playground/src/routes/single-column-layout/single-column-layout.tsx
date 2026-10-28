/**
 * Stackra file contract:
 * Purpose: the page of the single-column-layout route: a layout of stacked sections with its even gap, a layout whose
 *          child is wider than the column and scrolls inside it, an Arabic layout in a right-to-left block, and a live
 *          layout where buttons add and remove sections and the page reports the count, all from `@stackra/ui/react`
 *          with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n, text in another language carries
 *           its own `lang`. The page's own `h1` is a Heading; each sample's sections are level-3 headings under the
 *           sections' level-2 headings, so the page keeps its one `h1` and no skipped level. Every section's title is
 *           unique, so each region has its own name (axe `landmark-unique`). The layout draws no landmark of its own,
 *           so the samples' boxes are plain `div`s.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0317 (decision 7); ADR 0060
 *          (right-to-left); WCAG 2.2 SC 1.3.1, 1.4.10 and 4.1.3.
 */
import {
  Button,
  Heading,
  Section,
  SingleColumnLayout as UiSingleColumnLayout,
  Text,
} from "@stackra/ui/react";
import { useState, type ReactNode } from "react";

import { PageSection } from "#src/components/page-section";
import { SingleColumnLayoutRoute } from "#src/routes/single-column-layout/single-column-layout.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::single-column-layout.*` keys.
const STRINGS = {
  documentTitle: `${SingleColumnLayoutRoute.title} · Stackra Playground`,
  intro:
    "The single column layout is the frame of a detail page that has one column: its children, usually sections, stacked from top to bottom with an even gap. It draws no landmark and no heading of its own.",
  stacked: "Stacked sections",
  stackedNote: "Each child is one block of the page. The layout only spaces them.",
  stackedCaption: "Three stacked sections",
  wide: "A wide child",
  wideCaption: "A row wider than the column",
  scroller: "Scrollable items",
  wideNote:
    "A child wider than the column scrolls inside the column. The page itself never scrolls sideways.",
  arabic: "Arabic",
  arabicNote: "A right-to-left layout: each section reads from the right.",
  live: "Try it",
  liveNote: "Add and remove sections: the layout keeps one column and the same gap.",
  customer: "Customer",
  customerBody: "Ada Lovelace, ada@example.com",
  payment: "Payment",
  paymentBody: "Paid in full on 3 March",
  shipping: "Shipping",
  shippingBody: "Shipped on 5 March, arriving in two days",
  itemsTitle: "Items",
  itemsRow:
    "Product name, quantity, unit price, tax, discount, total, and the warehouse it ships from",
  arabicCustomer: "العميل",
  arabicCustomerBody: "منى السالم",
  arabicPayment: "الدفع",
  arabicPaymentBody: "تم الدفع بالكامل في 3 مارس",
  add: "Add a section",
  remove: "Remove a section",
  note: (index: number) => `Note ${index}`,
  noteBody: "A note on the order.",
  count: (count: number) => (count === 1 ? "1 section." : `${count} sections.`),
} as const;

/** The box a layout sits in, so its edges show. */
// `min-w-0` on every grid item between the page and the layout: a grid item grows to its content's min-content
// otherwise, and the wide sample would widen the page instead of scrolling inside the column.
const BOX = "min-w-0 rounded-xl border border-border p-4";

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
    <div className="grid min-w-0 content-start gap-2">
      <Text tone="muted" type="small">
        {caption}
      </Text>
      <div className={BOX} data-sample={sample}>
        {children}
      </div>
    </div>
  );
}

/** The SingleColumnLayout page. */
export function SingleColumnLayout() {
  const [count, setCount] = useState(2);

  return (
    <article className="grid grid-cols-[minmax(0,1fr)] gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Heading level={1}>{SingleColumnLayoutRoute.title}</Heading>
        <Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Text>
      </header>

      <PageSection
        id="single-column-layout-stacked"
        title={STRINGS.stacked}
        note={STRINGS.stackedNote}
      >
        <Sample caption={STRINGS.stackedCaption} sample="stacked">
          <UiSingleColumnLayout>
            <Section headingLevel={3} title={STRINGS.customer}>
              <Text>{STRINGS.customerBody}</Text>
            </Section>
            <Section headingLevel={3} title={STRINGS.payment}>
              <Text>{STRINGS.paymentBody}</Text>
            </Section>
            <Section headingLevel={3} title={STRINGS.shipping}>
              <Text>{STRINGS.shippingBody}</Text>
            </Section>
          </UiSingleColumnLayout>
        </Sample>
      </PageSection>

      <PageSection id="single-column-layout-wide" title={STRINGS.wide} note={STRINGS.wideNote}>
        <Sample caption={STRINGS.wideCaption} sample="wide">
          <UiSingleColumnLayout>
            <Section headingLevel={3} title={STRINGS.itemsTitle}>
              {/* A scroll region must be focusable to be reachable by keyboard: tabIndex makes it so (axe `scrollable-region-focusable`). */}
              <div
                className="overflow-x-auto"
                role="group"
                aria-label={STRINGS.scroller}
                // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- reason: a scroll region must take focus so a keyboard user can scroll it (WCAG 2.1.1)
                tabIndex={0}
                data-sample="wide-scroller"
              >
                <Text className="w-max min-w-[80rem]">{STRINGS.itemsRow}</Text>
              </div>
            </Section>
          </UiSingleColumnLayout>
        </Sample>
      </PageSection>

      <PageSection
        id="single-column-layout-arabic"
        title={STRINGS.arabic}
        note={STRINGS.arabicNote}
      >
        <div dir="rtl" lang="ar" className={BOX} data-sample="arabic">
          <UiSingleColumnLayout>
            <Section headingLevel={3} title={STRINGS.arabicCustomer}>
              <Text>{STRINGS.arabicCustomerBody}</Text>
            </Section>
            <Section headingLevel={3} title={STRINGS.arabicPayment}>
              <Text>{STRINGS.arabicPaymentBody}</Text>
            </Section>
          </UiSingleColumnLayout>
        </div>
      </PageSection>

      <PageSection id="single-column-layout-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <div className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onPress={() => setCount((current) => current + 1)}>
              {STRINGS.add}
            </Button>
            <Button
              variant="secondary"
              isDisabled={count === 0}
              onPress={() => setCount((current) => Math.max(0, current - 1))}
            >
              {STRINGS.remove}
            </Button>
          </div>
          <div className={BOX} data-sample="live">
            <UiSingleColumnLayout>
              {Array.from({ length: count }, (_, index) => (
                <Section key={index} headingLevel={3} title={STRINGS.note(index + 1)}>
                  <Text>{STRINGS.noteBody}</Text>
                </Section>
              ))}
            </UiSingleColumnLayout>
          </div>
          <Text role="status" tone="muted" data-sample="live-status">
            {STRINGS.count(count)}
          </Text>
        </div>
      </PageSection>
    </article>
  );
}

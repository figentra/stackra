/**
 * Stackra file contract:
 * Purpose: the page of the empty state route: one state per reason with copy that fits it, the parts one at a time
 *          (title only, an action, an icon of its own, no icon), and a live order list whose search ends in a
 *          no-results state with a clear button that returns focus to the search field, all from `@stackra/ui/react`
 *          with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. The design system carries no
 *           copy, so every word shown in a state is written here.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0313 (decisions 5 and 6); WCAG 2.2 SC 1.3.1, 2.4.3 and
 *          4.1.3; ADR 0060 (light, dark, RTL).
 */
import { EmptyReason } from "@stackra/ui/contracts";
import * as Ui from "@stackra/ui/react";
import { useState, type ReactNode } from "react";

import { PageSection } from "#src/components/page-section";
import { EmptyStateRoute } from "#src/routes/empty-state/empty-state.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::empty-state.*` keys.
const STRINGS = {
  documentTitle: `${EmptyStateRoute.title} · Stackra Playground`,
  intro:
    "An empty state takes the place of a list, a table or a page that has nothing to show. The reason picks the icon, and the title is a heading, so a screen reader finds it where the empty list used to be. It always says what to do next.",
  reasons: "Reasons",
  reasonsNote:
    "One state per reason: nothing exists yet, a search matched nothing, access is denied.",
  parts: "Parts",
  partsNote:
    "Only the title is required. The description, the actions and the icon are optional, and the icon can be your own or none.",
  live: "Try it",
  liveNote:
    "Search the orders for something that is not there. The no-results state appears with a button that clears the search and puts you back in the field.",
  searchLabel: "Search orders",
  searchPlaceholder: "Try “refund”",
  clearSearch: "Clear search",
  showAll: "Show all orders",
  resultsIntro: "Orders",
  create: "Create an order",
  clearFilters: "Clear filters",
  learnMore: "Request access",
  count: (shown: number) =>
    shown === 0 ? "No orders match." : shown === 1 ? "1 order shown." : `${shown} orders shown.`,
} as const;

/** The copy that fits each reason. */
const REASON_COPY = {
  "no-data": {
    title: "No orders yet",
    description: "Orders appear here once a customer pays.",
  },
  "no-results": {
    title: "No orders match your filters",
    description: "Try a different status or a wider date range.",
  },
  "permission-denied": {
    title: "You cannot see orders",
    description: "Ask an administrator to give you the orders permission.",
  },
} as const satisfies Record<EmptyReason, { readonly title: string; readonly description: string }>;

/** The orders of the live list, each one line of text. */
const ORDERS = [
  "Order 1042 · Ada Lovelace · paid",
  "Order 1043 · Grace Hopper · shipped",
  "Order 1044 · Alan Turing · refunded",
  "Order 1045 · Katherine Johnson · paid",
] as const;

/** The grid that lays samples out in a wrapping row of cards. */
const GRID = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";

/** The card an empty state sits in, as a table or panel would hold it. */
const CARD = "rounded-xl border border-separator";

/** A caption and the sample it describes, as one list item. */
function Sample({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <li className="grid content-start gap-2">
      <Ui.Text tone="muted" type="small">
        {caption}
      </Ui.Text>
      <div className={CARD}>{children}</div>
    </li>
  );
}

/** The EmptyState page. */
export function EmptyState() {
  const [query, setQuery] = useState("");
  const matches = ORDERS.filter((order) =>
    order.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const clearSearch = () => {
    setQuery("");
    // The button is about to leave the page, so focus goes back to the field it was clearing.
    requestAnimationFrame(() =>
      document.querySelector<HTMLInputElement>("#empty-state-demo input")?.focus(),
    );
  };

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Ui.Heading level={1}>{EmptyStateRoute.title}</Ui.Heading>
        <Ui.Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Ui.Text>
      </header>

      <PageSection id="empty-state-reasons" title={STRINGS.reasons} note={STRINGS.reasonsNote}>
        <ul className={GRID}>
          {EmptyReason.map((reason) => (
            <Sample key={reason} caption={`reason="${reason}"`}>
              <Ui.EmptyState
                reason={reason}
                headingLevel={3}
                title={REASON_COPY[reason].title}
                description={REASON_COPY[reason].description}
                actions={
                  reason === "permission-denied" ? undefined : (
                    <Ui.Button variant={reason === "no-data" ? "primary" : "secondary"}>
                      {reason === "no-data" ? STRINGS.create : STRINGS.clearFilters}
                    </Ui.Button>
                  )
                }
              />
            </Sample>
          ))}
        </ul>
      </PageSection>

      <PageSection id="empty-state-parts" title={STRINGS.parts} note={STRINGS.partsNote}>
        <ul className={GRID}>
          <Sample caption="Title only">
            <Ui.EmptyState headingLevel={3} title={REASON_COPY["no-data"].title} />
          </Sample>
          <Sample caption="With an action">
            <Ui.EmptyState
              headingLevel={3}
              title={REASON_COPY["no-data"].title}
              description={REASON_COPY["no-data"].description}
              actions={
                <>
                  <Ui.Button>{STRINGS.create}</Ui.Button>
                  <Ui.Button variant="ghost">{STRINGS.learnMore}</Ui.Button>
                </>
              }
            />
          </Sample>
          <Sample caption="An icon of your own">
            <Ui.EmptyState
              headingLevel={3}
              icon="triangle-alert"
              title="Importing is paused"
              description="Orders will appear here when the import resumes."
            />
          </Sample>
          <Sample caption="No icon">
            <Ui.EmptyState
              headingLevel={3}
              icon={false}
              title={REASON_COPY["no-results"].title}
              description={REASON_COPY["no-results"].description}
            />
          </Sample>
        </ul>
      </PageSection>

      <PageSection id="empty-state-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <div id="empty-state-demo" className="grid max-w-xl gap-4">
          <Ui.SearchField
            label={STRINGS.searchLabel}
            placeholder={STRINGS.searchPlaceholder}
            clearLabel={STRINGS.clearSearch}
            value={query}
            onChange={setQuery}
            isFullWidth
          />
          {/* The count is what a screen reader hears when the list becomes the empty state, or the reverse. */}
          <Ui.Text role="status" className="sr-only">
            {STRINGS.count(matches.length)}
          </Ui.Text>
          <div className={CARD} data-sample="live">
            {matches.length === 0 ? (
              <Ui.EmptyState
                reason="no-results"
                headingLevel={3}
                title={REASON_COPY["no-results"].title}
                description={`No order matches “${query.trim()}”. Check the spelling or clear the search.`}
                actions={
                  <Ui.Button variant="secondary" onPress={clearSearch}>
                    {STRINGS.showAll}
                  </Ui.Button>
                }
              />
            ) : (
              <ul aria-label={STRINGS.resultsIntro} className="grid divide-y divide-separator">
                {matches.map((order) => (
                  <li key={order} className="px-4 py-3">
                    <Ui.Text>{order}</Ui.Text>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </PageSection>
    </article>
  );
}

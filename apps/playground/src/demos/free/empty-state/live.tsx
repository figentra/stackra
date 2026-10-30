/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Empty state: Search the orders for something that is not there. The no-results
 *          state appears with a button that clears the search and puts you back in the field.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0313 (decisions 5 and 6); WCAG 2.2 SC 1.3.1, 2.4.3 and 4.1.3; ADR 0060 (light, dark, RTL).
 */
import type { EmptyReason } from "@stackra/ui/contracts";
import {
  Button,
  EmptyState as UiEmptyState,
  SearchField,
  Text,
  useCatalogueText,
} from "@stackra/ui/react";
import { useId, useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { EMPTY_STATE_KEYS } from "#src/demos/free/empty-state/empty-state-keys.constant";

/** The demo's keys. */
const K = EMPTY_STATE_KEYS.empty_state;

/** The orders of the live list, each one line of text. */
const ORDERS = [
  "Order 1042 · Ada Lovelace · paid",
  "Order 1043 · Grace Hopper · shipped",
  "Order 1044 · Alan Turing · refunded",
  "Order 1045 · Katherine Johnson · paid",
] as const;

/** The card an empty state sits in, as a table or panel would hold it. */
const CARD = "border border-separator";

/** Empty state: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  /** The copy that fits each reason. */
  const REASON_COPY = {
    "no-data": {
      title: t(K.sample.no_orders_yet),
      description: t(K.sample.orders_appear_here_once_a),
    },
    "no-results": {
      title: t(K.sample.no_orders_match_your_filters),
      description: t(K.sample.try_a_different_status_or),
    },
    "permission-denied": {
      title: t(K.sample.you_cannot_see_orders),
      description: t(K.sample.ask_an_administrator_to_give),
    },
  } as const satisfies Record<
    EmptyReason,
    { readonly title: string; readonly description: string }
  >;
  const searchId = useId();
  const [query, setQuery] = useState("");

  const matches = ORDERS.filter((order) =>
    order.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const clearSearch = () => {
    setQuery("");
    // The button is about to leave the page, so focus goes back to the field it was clearing.
    requestAnimationFrame(() =>
      document.getElementById(searchId)?.querySelector("input")?.focus(),
    );
  };

  return (
    <div id={searchId} className="grid max-w-xl gap-4">
      <SearchField
        label={t(K.search_label)}
        placeholder={t(K.search_placeholder)}
        clearLabel={t(K.clear_search)}
        value={query}
        onChange={setQuery}
        isFullWidth
      />
      {/* The count is what a screen reader hears when the list becomes the empty state, or the reverse. */}
      <Text role="status" className="sr-only">
        {t(K.count, { shown: matches.length })}
      </Text>
      <div className={CARD} data-sample="live">
        {matches.length === 0 ? (
          <UiEmptyState
            reason="no-results"
            headingLevel={3}
            title={REASON_COPY["no-results"].title}
            description={`No order matches “${query.trim()}”. Check the spelling or clear the search.`}
            actions={
              <Button variant="secondary" onPress={clearSearch}>
                {t(K.show_all)}
              </Button>
            }
          />
        ) : (
          <ul aria-label={t(K.results_intro)} className="grid divide-y divide-separator">
            {matches.map((order) => (
              <li key={order} className="px-4 py-3">
                <Text>{order}</Text>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

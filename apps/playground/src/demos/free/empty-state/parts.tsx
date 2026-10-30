/**
 * Stackra file contract:
 * Purpose: the "parts" demo of the web Empty state: Only the title is required. The description, the actions and the
 *          icon are optional, and the icon can be your own or none.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0313 (decisions 5 and 6); WCAG 2.2 SC 1.3.1, 2.4.3 and 4.1.3; ADR 0060 (light, dark, RTL).
 */
import type { EmptyReason } from "@stackra/ui/contracts";
import { Button, EmptyState as UiEmptyState, Text, useCatalogueText } from "@stackra/ui/react";
import type { ReactNode } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { EMPTY_STATE_KEYS } from "#src/demos/free/empty-state/empty-state-keys.constant";

/** The demo's keys. */
const K = EMPTY_STATE_KEYS.empty_state;

/** The grid that lays samples out in a wrapping row of cards. */
const GRID = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";

/** The card an empty state sits in, as a table or panel would hold it. */
const CARD = "border border-separator";

/** A caption and the sample it describes, as one list item. */
function Sample({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <li className="grid content-start gap-2">
      <Text tone="muted" type="small">
        {caption}
      </Text>
      <div className={CARD}>{children}</div>
    </li>
  );
}

/** Empty state: Parts. */
export default function Parts() {
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
  return (
    <ul className={GRID}>
      <Sample caption={t(K.sample.title_only)}>
        <UiEmptyState headingLevel={3} title={REASON_COPY["no-data"].title} />
      </Sample>
      <Sample caption={t(K.sample.with_an_action)}>
        <UiEmptyState
          headingLevel={3}
          title={REASON_COPY["no-data"].title}
          description={REASON_COPY["no-data"].description}
          actions={
            <>
              <Button>{t(K.create)}</Button>
              <Button variant="ghost">{t(K.learn_more)}</Button>
            </>
          }
        />
      </Sample>
      <Sample caption={t(K.sample.an_icon_of_your_own)}>
        <UiEmptyState
          headingLevel={3}
          icon="triangle-alert"
          title={t(K.sample.importing_is_paused)}
          description={t(K.sample.orders_will_appear_here_when)}
        />
      </Sample>
      <Sample caption={t(K.sample.no_icon)}>
        <UiEmptyState
          headingLevel={3}
          icon={false}
          title={REASON_COPY["no-results"].title}
          description={REASON_COPY["no-results"].description}
        />
      </Sample>
    </ul>
  );
}

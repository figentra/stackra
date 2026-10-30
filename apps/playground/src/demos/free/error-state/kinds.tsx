/**
 * Stackra file contract:
 * Purpose: the "kinds" demo of the web Error state: One state per kind: sign-in needed (401), not allowed (403), not
 *          found (404) and anything unexpected.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0313 (decisions 1 and 6); ADR 0140; WCAG 2.2 SC 1.3.1, 2.4.3 and 4.1.3; ADR 0060 (light, dark, RTL).
 */
import { ErrorStateKind } from "@stackra/ui/contracts";
import { Button, ErrorState as UiErrorState, Text, useCatalogueText } from "@stackra/ui/react";
import type { ReactNode } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { ERROR_STATE_KEYS } from "#src/demos/free/error-state/error-state-keys.constant";

/** The demo's keys. */
const K = ERROR_STATE_KEYS.error_state;

/** The grid that lays samples out in a wrapping row of cards. */
const GRID = "grid gap-4 sm:grid-cols-2";

/** The card an error state sits in, as a page or panel would hold it. */
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

/** Error state: Kinds. */
export default function Kinds() {
  const t = useCatalogueText(MESSAGES.en);
  /** The copy that fits each kind. */
  const KIND_COPY = {
    unauthenticated: {
      title: t(K.sample.sign_in_to_continue),
      description: t(K.sample.your_session_ended_sign_in),
    },
    forbidden: {
      title: t(K.sample.you_do_not_have_access),
      description: t(K.sample.ask_an_administrator_to_give),
    },
    "not-found": {
      title: t(K.sample.we_could_not_find_that),
      description: t(K.sample.the_link_may_be_old),
    },
    unexpected: {
      title: t(K.sample.something_went_wrong),
      description: t(K.sample.we_could_not_load_this),
    },
  } as const satisfies Record<
    ErrorStateKind,
    { readonly title: string; readonly description: string }
  >;
  return (
    <ul className={GRID}>
      {ErrorStateKind.map((kind) => (
        <Sample key={kind} caption={`kind="${kind}"`}>
          <UiErrorState
            kind={kind}
            headingLevel={3}
            title={KIND_COPY[kind].title}
            description={KIND_COPY[kind].description}
            actions={
              kind === "unauthenticated" ? (
                <Button>{t(K.sign_in)}</Button>
              ) : kind === "not-found" || kind === "forbidden" ? (
                <Button variant="secondary">{t(K.go_back)}</Button>
              ) : undefined
            }
            retry={
              kind === "unexpected" ? { label: t(K.retry), onPress: () => undefined } : undefined
            }
          />
        </Sample>
      ))}
    </ul>
  );
}

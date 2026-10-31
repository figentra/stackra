/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Error state: The orders failed to load. Try again: the list loads for a moment
 *          and recovers. Focus moves to the region each time, so a keyboard user does not lose their place.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0313 (decisions 1 and 6); ADR 0140; WCAG 2.2 SC 1.3.1, 2.4.3 and 4.1.3; ADR 0060 (light, dark, RTL).
 */
import type { ErrorStateKind } from "@stackra/ui/contracts";
import {
  Button,
  ErrorState as UiErrorState,
  Heading,
  PageSkeleton,
  Text,
  useCatalogueText,
} from "@stackra/ui/react";
import { useEffect, useRef, useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { ERROR_STATE_KEYS } from "#src/demos/free/error-state/error-state-keys.constant";

/** The demo's keys. */
const K = ERROR_STATE_KEYS.error_state;

/** The error the details sample shows, as a failed request would throw it. */
// Without its stack: a sample's stack is this page's own source path and line, not a failed request's.
const FAILURE = Object.assign(
  new Error("The order service did not answer in time (order_unavailable)."),
  { stack: undefined },
);

/** How long the live sample takes to recover, in milliseconds. */
// oxlint-disable-next-line stackra/no-literal-duration -- a demo's fake recovery delay, not motion
const RETRY_MS = 600;

/** The card an error state sits in, as a page or panel would hold it. */
const CARD = "border border-separator";

/** What the live sample shows. */
type Phase = "failed" | "loading" | "ready";

/** Error state: Try it. */
export default function Live() {
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
  const [phase, setPhase] = useState<Phase>("failed");

  const region = useRef<HTMLDivElement>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // The timer is cleared on unmount, so a page left mid-retry never sets state afterwards.
  useEffect(() => () => clearTimeout(timer.current), []);

  /** The control that was pressed leaves the page, so focus goes to the region, where the new state is. */
  const focusRegion = () => requestAnimationFrame(() => region.current?.focus());

  const retry = () => {
    setPhase("loading");
    focusRegion();
    timer.current = setTimeout(() => {
      setPhase("ready");
      focusRegion();
    }, RETRY_MS);
  };

  return (
    <div
      ref={region}
      role="group"
      aria-label={t(K.region_name)}
      tabIndex={-1}
      className={`${CARD} max-w-xl focus-visible:outline-2 focus-visible:outline-focus`}
      data-sample="live"
    >
      {phase === "failed" ? (
        <UiErrorState
          headingLevel={3}
          title={KIND_COPY.unexpected.title}
          description={KIND_COPY.unexpected.description}
          error={FAILURE}
          isMessageShown
          retry={{ label: t(K.retry), onPress: retry }}
        />
      ) : phase === "loading" ? (
        <div className="p-6">
          <PageSkeleton layout="section" loadingLabel={t(K.loading_orders)} />
        </div>
      ) : (
        <div className="grid justify-items-start gap-3 p-6">
          <Heading level={3}>{t(K.recovered)}</Heading>
          <Text tone="muted">{t(K.recovered_note)}</Text>
          <Button
            variant="secondary"
            onPress={() => {
              setPhase("failed");
              focusRegion();
            }}
          >
            {t(K.break_again)}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Stackra file contract:
 * Purpose: the page of the error state route: one state per kind with copy that fits it, the parts one at a time
 *          (the error's details, a retry with a further action, an icon of its own, no icon), and a live retry that
 *          fails, loads and recovers, with focus moved to the region on each change, all from `@stackra/ui/react`
 *          with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. The design system carries no
 *           copy, so every word shown in a state is written here. An error state is a live region, so the failure the
 *           live sample shows after a press is read out at once; the static samples are on the page at load and are
 *           not. The stack is shown in development only, so the production build this page is tested in shows the
 *           message alone.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0313 (decisions 1 and 6); ADR 0140; WCAG 2.2 SC 1.3.1, 2.4.3
 *          and 4.1.3; ADR 0060 (light, dark, RTL).
 */
import { ErrorStateKind } from "@stackra/ui/contracts";
import { Button, ErrorState as UiErrorState, Heading, PageSkeleton, Text } from "@stackra/ui/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { PageSection } from "#src/components/page-section";
import { ErrorStateRoute } from "#src/routes/error-state/error-state.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::error-state.*` keys.
const STRINGS = {
  documentTitle: `${ErrorStateRoute.title} · Stackra Playground`,
  intro:
    "An error state is what a route shows when its page cannot load. The kind picks the icon, the title is a heading, and the page is announced at once by a screen reader. It offers a way forward: sign in, go back or try again.",
  kinds: "Kinds",
  kindsNote:
    "One state per kind: sign-in needed (401), not allowed (403), not found (404) and anything unexpected.",
  parts: "Parts",
  partsNote:
    "Only the title is required. The error's message is shown as details, a retry runs what you give it, and the icon can be your own or none.",
  live: "Try it",
  liveNote:
    "The orders failed to load. Try again: the list loads for a moment and recovers. Focus moves to the region each time, so a keyboard user does not lose their place.",
  regionName: "Orders demo",
  retry: "Try again",
  signIn: "Sign in",
  goBack: "Go back",
  contactSupport: "Contact support",
  loadingOrders: "Loading orders",
  recovered: "Orders loaded",
  recoveredNote: "The list came back. Break it again to see the failure once more.",
  breakAgain: "Break it again",
} as const;

/** The copy that fits each kind. */
const KIND_COPY = {
  unauthenticated: {
    title: "Sign in to continue",
    description: "Your session ended. Sign in again to see this page.",
  },
  forbidden: {
    title: "You do not have access",
    description: "Ask an administrator to give you access to this page.",
  },
  "not-found": {
    title: "We could not find that page",
    description: "The link may be old, or the page may have moved.",
  },
  unexpected: {
    title: "Something went wrong",
    description: "We could not load this page. Try again in a moment.",
  },
} as const satisfies Record<
  ErrorStateKind,
  { readonly title: string; readonly description: string }
>;

/** The error the details sample shows, as a failed request would throw it. */
const FAILURE = new Error("The order service did not answer in time (order_unavailable).");

/** How long the live sample takes to recover, in milliseconds. */
const RETRY_MS = 600;

/** The grid that lays samples out in a wrapping row of cards. */
const GRID = "grid gap-4 sm:grid-cols-2";

/** The card an error state sits in, as a page or panel would hold it. */
const CARD = "rounded-xl border border-separator";

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

/** What the live sample shows. */
type Phase = "failed" | "loading" | "ready";

/** The ErrorState page. */
export function ErrorState() {
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
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Heading level={1}>{ErrorStateRoute.title}</Heading>
        <Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Text>
      </header>

      <PageSection id="error-state-kinds" title={STRINGS.kinds} note={STRINGS.kindsNote}>
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
                    <Button>{STRINGS.signIn}</Button>
                  ) : kind === "not-found" || kind === "forbidden" ? (
                    <Button variant="secondary">{STRINGS.goBack}</Button>
                  ) : undefined
                }
                retry={
                  kind === "unexpected"
                    ? { label: STRINGS.retry, onPress: () => undefined }
                    : undefined
                }
              />
            </Sample>
          ))}
        </ul>
      </PageSection>

      <PageSection id="error-state-parts" title={STRINGS.parts} note={STRINGS.partsNote}>
        <ul className={GRID}>
          <Sample caption="With the error's details">
            <UiErrorState
              headingLevel={3}
              title={KIND_COPY.unexpected.title}
              description={KIND_COPY.unexpected.description}
              error={FAILURE}
              isMessageShown
            />
          </Sample>
          <Sample caption="A retry and a further action">
            <UiErrorState
              headingLevel={3}
              title={KIND_COPY.unexpected.title}
              description={KIND_COPY.unexpected.description}
              retry={{ label: STRINGS.retry, onPress: () => undefined }}
              actions={<Button variant="ghost">{STRINGS.contactSupport}</Button>}
            />
          </Sample>
          <Sample caption="An icon of your own">
            <UiErrorState
              headingLevel={3}
              icon="lock"
              title="This page is locked"
              description="An administrator has paused access while the data is checked."
            />
          </Sample>
          <Sample caption="No icon">
            <UiErrorState
              headingLevel={3}
              icon={false}
              title={KIND_COPY["not-found"].title}
              description={KIND_COPY["not-found"].description}
            />
          </Sample>
        </ul>
      </PageSection>

      <PageSection id="error-state-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <div
          ref={region}
          role="group"
          aria-label={STRINGS.regionName}
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
              retry={{ label: STRINGS.retry, onPress: retry }}
            />
          ) : phase === "loading" ? (
            <div className="p-6">
              <PageSkeleton layout="section" loadingLabel={STRINGS.loadingOrders} />
            </div>
          ) : (
            <div className="grid justify-items-start gap-3 p-6">
              <Heading level={3}>{STRINGS.recovered}</Heading>
              <Text tone="muted">{STRINGS.recoveredNote}</Text>
              <Button
                variant="secondary"
                onPress={() => {
                  setPhase("failed");
                  focusRegion();
                }}
              >
                {STRINGS.breakAgain}
              </Button>
            </div>
          )}
        </div>
      </PageSection>
    </article>
  );
}

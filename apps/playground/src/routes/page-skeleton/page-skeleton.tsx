/**
 * Stackra file contract:
 * Purpose: the page of the page skeleton route: every layout, every animation on one layout, and a list that reloads
 *          from a table skeleton to its content, all from `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. Each skeleton names what it
 *           loads, so a screen reader hears one status per skeleton and nothing from the placeholders.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0304; ADR 0313 (decisions 1 and 6); WCAG 2.2 SC 4.1.3; ADR 0060 (light, dark, RTL).
 */
import { PageSkeletonLayout, SkeletonAnimation } from "@stackra/ui/contracts";
import { Button, Heading, PageSkeleton as UiPageSkeleton, Text } from "@stackra/ui/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { PageSection } from "#src/components/page-section";
import { PageSkeletonRoute } from "#src/routes/page-skeleton/page-skeleton.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::page-skeleton.*` keys.
const STRINGS = {
  documentTitle: `${PageSkeletonRoute.title} · Stackra Playground`,
  intro:
    "A page skeleton stands in for a page that is still loading, with placeholders shaped like what will arrive. It is one group with one sweep and one spoken name, so a screen reader hears what loads once and nothing from the placeholders.",
  layouts: "Layouts",
  layoutsNote: "One skeleton per layout: a whole page, a table, a section and a form.",
  animations: "Animations",
  animationsNote:
    "The section layout in each animation: a sweeping shimmer, a slow pulse and a still one.",
  live: "Loading to content",
  liveNote:
    "Reload the orders: the table skeleton shows for a moment while the button stays busy, then the content is back.",
  regionName: "Orders demo",
  reload: "Reload orders",
  loadingOrders: "Loading orders",
} as const;

/** The orders of the loaded content, each one line of text. */
const ORDERS = [
  "Order 1042 · Ada Lovelace · paid",
  "Order 1043 · Grace Hopper · shipped",
  "Order 1044 · Alan Turing · refunded",
  "Order 1045 · Katherine Johnson · paid",
] as const;

/** How long the live sample stays a skeleton after a reload, in milliseconds. */
const RELOAD_MS = 1500;

/** The grid that lays samples out in a wrapping row of cards. */
const GRID = "grid gap-4 md:grid-cols-2";

/** The card a skeleton sits in, as a page or panel would hold it. */
const CARD = "rounded-xl border border-separator p-6";

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

/** The PageSkeleton page. */
export function PageSkeleton() {
  const [isLoading, setIsLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // The timer is cleared on unmount, so a page left mid-reload never sets state afterwards.
  useEffect(() => () => clearTimeout(timer.current), []);

  const reload = () => {
    setIsLoading(true);
    timer.current = setTimeout(() => setIsLoading(false), RELOAD_MS);
  };

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Heading level={1}>{PageSkeletonRoute.title}</Heading>
        <Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Text>
      </header>

      <PageSection id="page-skeleton-layouts" title={STRINGS.layouts} note={STRINGS.layoutsNote}>
        <ul className={GRID}>
          {PageSkeletonLayout.map((layout) => (
            <Sample key={layout} caption={`layout="${layout}"`}>
              <UiPageSkeleton layout={layout} loadingLabel={`Loading the ${layout} layout`} />
            </Sample>
          ))}
        </ul>
      </PageSection>

      <PageSection
        id="page-skeleton-animations"
        title={STRINGS.animations}
        note={STRINGS.animationsNote}
      >
        <ul className={GRID}>
          {SkeletonAnimation.map((animationType) => (
            <Sample key={animationType} caption={`animationType="${animationType}"`}>
              <UiPageSkeleton
                layout="section"
                animationType={animationType}
                loadingLabel={`Loading with ${animationType}`}
              />
            </Sample>
          ))}
        </ul>
      </PageSection>

      <PageSection id="page-skeleton-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <div className="grid max-w-xl justify-items-start gap-4">
          <Button variant="secondary" isLoading={isLoading} onPress={reload}>
            {STRINGS.reload}
          </Button>
          <div
            role="group"
            aria-label={STRINGS.regionName}
            className={`${CARD} w-full`}
            data-sample="live"
          >
            {isLoading ? (
              <UiPageSkeleton layout="table" loadingLabel={STRINGS.loadingOrders} />
            ) : (
              <ul className="grid divide-y divide-separator">
                {ORDERS.map((order) => (
                  <li key={order} className="py-3 first:pt-0 last:pb-0">
                    <Text>{order}</Text>
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

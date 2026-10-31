/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Page skeleton: Reload the orders: the table skeleton shows for a moment while
 *          the button stays busy, then the content is back.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0304; ADR 0313 (decisions 1 and 6); WCAG 2.2 SC 4.1.3; ADR 0060 (light, dark, RTL).
 */
import { Button, PageSkeleton as UiPageSkeleton, Text, useCatalogueText } from "@stackra/ui/react";
import { useEffect, useRef, useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { PAGE_SKELETON_KEYS } from "#src/demos/free/page-skeleton/page-skeleton-keys.constant";

/** The demo's keys. */
const K = PAGE_SKELETON_KEYS.page_skeleton;

/** The orders of the loaded content, each one line of text. */
const ORDERS = [
  "Order 1042 · Ada Lovelace · paid",
  "Order 1043 · Grace Hopper · shipped",
  "Order 1044 · Alan Turing · refunded",
  "Order 1045 · Katherine Johnson · paid",
] as const;

/** How long the live sample stays a skeleton after a reload, in milliseconds. */
// oxlint-disable-next-line stackra/no-literal-duration -- a demo's fake reload delay, not motion
const RELOAD_MS = 1500;

/** The card a skeleton sits in, as a page or panel would hold it. */
const CARD = "border border-separator p-6";

/** Page skeleton: Loading to content. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [isLoading, setIsLoading] = useState(false);

  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // The timer is cleared on unmount, so a page left mid-reload never sets state afterwards.
  useEffect(() => () => clearTimeout(timer.current), []);

  const reload = () => {
    setIsLoading(true);
    timer.current = setTimeout(() => setIsLoading(false), RELOAD_MS);
  };

  return (
    <div className="grid max-w-xl justify-items-start gap-4">
      <Button variant="secondary" isLoading={isLoading} onPress={reload}>
        {t(K.reload)}
      </Button>
      <div
        role="group"
        aria-label={t(K.region_name)}
        className={`${CARD} w-full`}
        data-sample="live"
      >
        {isLoading ? (
          <UiPageSkeleton layout="table" loadingLabel={t(K.loading_orders)} />
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
  );
}

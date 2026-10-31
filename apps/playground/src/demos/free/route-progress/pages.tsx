/**
 * Stackra file contract:
 * Purpose: the "pages" demo of the web RouteProgress: moving between Orders, Products and Reports takes a moment, and
 *          the bar shows it while the next page loads.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           The load is a timer standing in for a router's pending state.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); gap inventory row 29; ADR 0060
 *          (light, dark, RTL).
 */
import { Button, RouteProgress, Text, useCatalogueText } from "@stackra/ui/react";
import { useEffect, useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { ROUTE_PROGRESS_KEYS } from "#src/demos/free/route-progress/route-progress-keys.constant";

/** The demo's keys. */
const K = ROUTE_PROGRESS_KEYS.route_progress;

/** The pages and how long the stand-in router takes to load one, in ms. */
const PAGES = ["orders", "products", "reports"] as const;
// oxlint-disable-next-line stackra/no-literal-duration -- a demo's fake page load, not motion
const LOAD_MS = 1600;

/** Route progress: Between pages. */
export default function Pages() {
  const t = useCatalogueText(MESSAGES.en);
  const [page, setPage] = useState<(typeof PAGES)[number]>("orders");
  const [pending, setPending] = useState<(typeof PAGES)[number] | null>(null);
  useEffect(() => {
    if (pending === null) return undefined;
    const timer = setTimeout(() => {
      setPage(pending);
      setPending(null);
    }, LOAD_MS);
    return () => clearTimeout(timer);
  }, [pending]);
  return (
    <div className="relative grid gap-4 border border-border p-4">
      <RouteProgress isLoading={pending !== null} isFixed={false} />
      <nav className="flex gap-2">
        {PAGES.map((each) => (
          <Button
            key={each}
            size="sm"
            variant={each === page ? "primary" : "ghost"}
            onPress={() => setPending(each)}
          >
            {t(K[each])}
          </Button>
        ))}
      </nav>
      <Text>{t(K.page_body, { page: t(K[page]) })}</Text>
    </div>
  );
}

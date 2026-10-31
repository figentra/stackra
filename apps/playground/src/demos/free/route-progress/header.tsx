/**
 * Stackra file contract:
 * Purpose: the "header" demo of the web RouteProgress: the bar runs along the top of a store header while the sales
 *          report opens, with its own accessible name.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
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

/** How long the report takes to open, in ms. */
// oxlint-disable-next-line stackra/no-literal-duration -- a demo's fake page load, not motion
const LOAD_MS = 2400;

/** Route progress: Under a header. */
export default function Header() {
  const t = useCatalogueText(MESSAGES.en);
  const [isLoading, setLoading] = useState(false);
  useEffect(() => {
    if (!isLoading) return undefined;
    const timer = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(timer);
  }, [isLoading]);
  return (
    <header className="relative flex items-center justify-between gap-4 border-b border-border bg-surface p-4">
      <RouteProgress isLoading={isLoading} isFixed={false} label={t(K.opening)} />
      <Text className="font-semibold">{t(K.store)}</Text>
      <Button size="sm" variant="secondary" isDisabled={isLoading} onPress={() => setLoading(true)}>
        {t(K.open_report)}
      </Button>
    </header>
  );
}

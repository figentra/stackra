/**
 * Stackra file contract:
 * Purpose: the "navigation" demo of the web RouteProgress: start a load and the bar trickles across the top of the
 *          frame from the reading start; finish it and the bar fills and fades.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           `isFixed` is off so the bar sits in the demo frame, not the showcase's own top edge.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); gap inventory row 29; ADR 0060
 *          (light, dark, RTL).
 */
import { Button, RouteProgress, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { ROUTE_PROGRESS_KEYS } from "#src/demos/free/route-progress/route-progress-keys.constant";

/** The demo's keys. */
const K = ROUTE_PROGRESS_KEYS.route_progress;

/** Route progress: Navigation. */
export default function Navigation() {
  const t = useCatalogueText(MESSAGES.en);
  const [isLoading, setLoading] = useState(false);
  return (
    <div className="relative grid min-h-32 place-items-center gap-3 border border-border p-6">
      <RouteProgress isLoading={isLoading} isFixed={false} />
      <Text tone="muted">{isLoading ? t(K.loading) : t(K.ready)}</Text>
      <Button variant="secondary" onPress={() => setLoading((now) => !now)}>
        {isLoading ? t(K.finish) : t(K.start)}
      </Button>
    </div>
  );
}

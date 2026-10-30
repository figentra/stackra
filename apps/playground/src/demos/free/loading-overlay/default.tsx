/**
 * Stackra file contract:
 * Purpose: the "default" demo of the web Loading overlay: the catalogue's own words when no message is given.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Card, LoadingOverlay, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { LOADING_OVERLAY_KEYS } from "#src/demos/free/loading-overlay/loading-overlay-keys.constant";

/** The demo's keys. */
const K = LOADING_OVERLAY_KEYS.loading_overlay.default;

/** Loading overlay: the catalogue's own words when no message is given. */
export default function Default() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <LoadingOverlay isLoading>
      <Card className="grid gap-2 p-4">
        <Text className="font-medium">{t(K.title)}</Text>
        <Text tone="muted">{t(K.body)}</Text>
      </Card>
    </LoadingOverlay>
  );
}

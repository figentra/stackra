/**
 * Stackra file contract:
 * Purpose: the "kinds" demo of the web tamo-marker: the marker on content Tamo made, and on a field Tamo filled that awaits a check.
 * Boundary: a demo with no props: @stackra/ui, @stackra/ai's offline mock client and local state only; every word
 *           from the catalogue. The same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          ADR 0507 (Ask Tamo).
 */
import { Surface, TamoMarker, Text, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { TAMO_MARKER_KEYS } from "#src/demos/free/tamo-marker/tamo-marker-keys.constant";

/** The demo's keys. */
const K = TAMO_MARKER_KEYS.tamo_marker;

/** Tamo marker: kinds. */
export default function Kinds() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid max-w-md gap-4">
      <Surface variant="default" className="grid gap-2 p-3">
        <Text type="small">
          <bdi>{t(K.content)}</bdi>
        </Text>
        <TamoMarker />
      </Surface>
      <Surface variant="default" className="grid gap-2 p-3">
        <Text type="small">
          <bdi>{t(K.field)}</bdi>
        </Text>
        <TamoMarker needsReview />
      </Surface>
    </div>
  );
}

/**
 * Stackra file contract:
 * Purpose: the "previews" demo of the web Drop zone: product photos dropped, picked or taken with the camera, each
 *          listed under the zone with its thumbnail and a remove button.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave C, owner approval 2026-10-29).
 */
import { DropZone, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { DROP_ZONE_KEYS } from "#src/demos/free/drop-zone/drop-zone-keys.constant";

/** The demo's keys. */
const K = DROP_ZONE_KEYS.drop_zone.previews;

/** Drop zone: Camera and previews. */
export default function Previews() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <DropZone
      label={t(K.label)}
      description={t(K.hint)}
      acceptedFileTypes={["image/*"]}
      allowsMultiple
      allowsCamera
      showPreviews
      className="w-full max-w-md"
    />
  );
}

/**
 * Stackra file contract:
 * Purpose: the "paste" demo of the web Drop zone: a receipt attached by pasting a copied screenshot anywhere on the
 *          page, shown as a preview under the zone.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave C, owner approval 2026-10-29).
 */
import { DropZone, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { DROP_ZONE_KEYS } from "#src/demos/free/drop-zone/drop-zone-keys.constant";

/** The demo's keys. */
const K = DROP_ZONE_KEYS.drop_zone.paste;

/** Drop zone: Paste a screenshot. */
export default function Paste() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <DropZone
      label={t(K.label)}
      description={t(K.hint)}
      acceptedFileTypes={["image/*"]}
      allowsPaste
      showPreviews
      className="w-full max-w-md"
    />
  );
}

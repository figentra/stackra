/**
 * Stackra file contract:
 * Purpose: the "previews" demo of the native Drop zone: product photos picked or taken with the camera, each listed under the zone with its thumbnail and a remove button.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave C, owner approval 2026-10-29).
 */
import { DropZone, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DROP_ZONE_DEMO_KEYS } from "#src/demos/free/drop-zone/drop-zone-demo-keys.constant";

/** The demo's keys. */
const K = DROP_ZONE_DEMO_KEYS.demo_free.drop_zone.previews;

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
    />
  );
}

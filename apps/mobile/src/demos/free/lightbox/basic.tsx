/**
 * Stackra file contract:
 * Purpose: the "basic" demo of the native Lightbox: a button opens the trip photos full screen; swipe or the arrows
 *          step through them, and the close button or the back button closes.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave C).
 */
import { Button, Lightbox, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { DEMO_PHOTOS } from "#src/demos/free/gallery/demo-photos.constant";
import { GALLERY_DEMO_KEYS } from "#src/demos/free/gallery/gallery-demo-keys.constant";

/** The demo's keys. */
const K = GALLERY_DEMO_KEYS.demo_free.gallery.photos;

/** Lightbox: opened from a button. */
export default function Basic() {
  const t = useCatalogueText(MESSAGES.en);
  const [isOpen, setOpen] = useState(false);
  const images = DEMO_PHOTOS.map((photo) => ({
    ...photo,
    alt: t(K[photo.id]),
    ...(photo.id === "dunes" ? { caption: t(K.dunes_caption) } : {}),
  }));
  return (
    <>
      <Button startIcon="images" onPress={() => setOpen(true)}>
        {t(K.open_viewer)}
      </Button>
      <Lightbox label={t(K.label)} images={images} isOpen={isOpen} onOpenChange={setOpen} />
    </>
  );
}

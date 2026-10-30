/**
 * Stackra file contract:
 * Purpose: the "basic" demo of the web Lightbox: a button opens the trip photos full screen at the first one; the
 *          arrows, a swipe or the arrow keys step through them and Escape closes.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave C).
 */
import { Button, Lightbox, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { DEMO_PHOTOS } from "#src/demos/free/gallery/demo-photos.constant";
import { GALLERY_KEYS } from "#src/demos/free/gallery/gallery-keys.constant";
import { LIGHTBOX_KEYS } from "#src/demos/free/lightbox/lightbox-keys.constant";

/** The demo's keys. */
const K = LIGHTBOX_KEYS.lightbox;

/** The shared pictures' keys. */
const G = GALLERY_KEYS.gallery;

/** Lightbox: opened from a button. */
export default function Basic() {
  const t = useCatalogueText(MESSAGES.en);
  const [isOpen, setOpen] = useState(false);
  const images = DEMO_PHOTOS.map((photo) => ({
    ...photo,
    alt: t(G[photo.id]),
    ...(photo.id === "dunes" ? { caption: t(G.dunes_caption) } : {}),
    ...(photo.id === "harbour" ? { caption: t(G.harbour_caption) } : {}),
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

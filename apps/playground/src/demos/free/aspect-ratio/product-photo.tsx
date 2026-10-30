/**
 * Stackra file contract:
 * Purpose: the "product-photo" demo of the web AspectRatio: three product photos of different shapes, each cropped
 *          into the same square, with a name and a price under it.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { AspectRatio, Grid, Text, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { ASPECT_RATIO_KEYS } from "#src/demos/free/aspect-ratio/aspect-ratio-keys.constant";
import { DEMO_PHOTOS } from "#src/demos/free/gallery/demo-photos.constant";
import { GALLERY_KEYS } from "#src/demos/free/gallery/gallery-keys.constant";

/** The demo's keys. */
const K = ASPECT_RATIO_KEYS.aspect_ratio.product_photo;

/** The photos' words. */
const G = GALLERY_KEYS.gallery;

/** Each photo's price. */
const PRICES = [K.price_1, K.price_2, K.price_3];

/** AspectRatio: square product photos. */
export default function ProductPhoto() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Grid columns={3} gap="md" className="w-full max-w-xl">
      {DEMO_PHOTOS.slice(0, 3).map((photo, position) => (
        <div key={photo.id} className="grid gap-1">
          <AspectRatio ratio={1} className="bg-default">
            <img src={photo.src} alt={t(G[photo.id])} />
          </AspectRatio>
          <Text type="small" className="font-medium">
            {t(G[photo.id])}
          </Text>
          <Text type="small" tone="muted">
            {t(PRICES[position] ?? K.price_1)}
          </Text>
        </div>
      ))}
    </Grid>
  );
}

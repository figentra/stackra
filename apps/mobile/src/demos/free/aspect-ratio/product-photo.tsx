/**
 * Stackra file contract:
 * Purpose: the "product-photo" demo of the native AspectRatio: two product photos of different shapes, each cropped
 *          into the same square, with a name and a price under it.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { AspectRatio, Text, useCatalogueText } from "@stackra/ui/native";
import { Image, View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { ASPECT_RATIO_DEMO_KEYS } from "#src/demos/free/aspect-ratio/aspect-ratio-demo-keys.constant";
import { DEMO_PHOTOS } from "#src/demos/free/gallery/demo-photos.constant";
import { GALLERY_DEMO_KEYS } from "#src/demos/free/gallery/gallery-demo-keys.constant";

/** The demo's keys. */
const K = ASPECT_RATIO_DEMO_KEYS.demo_free.aspect_ratio.product_photo;

/** The photos' words. */
const G = GALLERY_DEMO_KEYS.demo_free.gallery.photos;

/** Each photo's price. */
const PRICES = [K.price_1, K.price_2];

/** AspectRatio: square product photos. */
export default function ProductPhoto() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="flex-row gap-3">
      {DEMO_PHOTOS.slice(0, 2).map((photo, position) => (
        <View key={photo.id} className="flex-1 gap-1">
          <AspectRatio ratio={1} className="bg-default">
            <Image
              source={{ uri: photo.src }}
              accessibilityLabel={t(G[photo.id])}
              resizeMode="cover"
              style={{ width: "100%", height: "100%" }}
            />
          </AspectRatio>
          <Text type="small" className="font-medium">
            {t(G[photo.id])}
          </Text>
          <Text type="small" tone="muted">
            {t(PRICES[position] ?? K.price_1)}
          </Text>
        </View>
      ))}
    </View>
  );
}

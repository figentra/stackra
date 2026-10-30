/**
 * Stackra file contract:
 * Purpose: the "fallbacks" demo of the native Thumbnail: no image, a broken image and a named one.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6);
 *          design-system gap inventory row 12.
 */
import { Thumbnail, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";
import { MESSAGES } from "#src/constants/messages.constant";
import { THUMBNAIL_DEMO_KEYS } from "#src/demos/free/thumbnail/thumbnail-demo-keys.constant";

/** The demo's keys. */
const K = THUMBNAIL_DEMO_KEYS.demo_free.thumbnail.fallbacks;

/** A one-pixel latte-brown PNG, so the sample never touches the network; React Native's Image draws no SVG. */
const PRODUCT =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNIKekGAAKjAWRgxqrsAAAAAElFTkSuQmCC";

/** A URL that is not an image, so the thumbnail falls back to its icon. */
const BROKEN_IMAGE = "https://invalid.example/missing-product.png";

/** Each fallback, captioned. */
export default function Fallbacks() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="flex-row flex-wrap items-start gap-4">
      <Sample caption={t(K.empty)}>
        <Thumbnail />
      </Sample>
      <Sample caption={t(K.broken)}>
        <Thumbnail src={BROKEN_IMAGE} />
      </Sample>
      <Sample caption={t(K.named)}>
        <Thumbnail src={PRODUCT} alt={t(K.latte)} />
      </Sample>
    </View>
  );
}

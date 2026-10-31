/**
 * Stackra file contract:
 * Purpose: the "fallback" demo of the native Image: no image, and a broken link, each keep their space and show an icon.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (gap build, owner approval 2026-10-31).
 */
import { Image, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { IMAGE_DEMO_KEYS } from "#src/demos/free/image/image-demo-keys.constant";

/** The demo's keys. */
const K = IMAGE_DEMO_KEYS.demo_free.image.fallback;

/** A URL that is not an image, so the picture falls back to its icon. */
const BROKEN_IMAGE = "https://invalid.example/missing-photo.png";

/** Image: missing and broken pictures keep their space. */
export default function Fallback() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      <Image caption={t(K.missing)} />
      <Image src={BROKEN_IMAGE} caption={t(K.broken)} />
    </View>
  );
}

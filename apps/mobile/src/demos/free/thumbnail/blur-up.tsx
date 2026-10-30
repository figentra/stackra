/**
 * Stackra file contract:
 * Purpose: the "blur-up" demo of the native Thumbnail: a blurred placeholder, then the photo fading in; load it again to replay.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6);
 *          design-system gap inventory row 12.
 */
import { Button, Thumbnail, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { THUMBNAIL_DEMO_KEYS } from "#src/demos/free/thumbnail/thumbnail-demo-keys.constant";

/** The demo's keys. */
const K = THUMBNAIL_DEMO_KEYS.demo_free.thumbnail.blur_up;

/** A one-pixel latte-brown PNG, so the sample never touches the network; React Native's Image draws no SVG. */
const PRODUCT =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNIKekGAAKjAWRgxqrsAAAAAElFTkSuQmCC";

/** A new key remounts the thumbnail, so the fade plays again. */
export default function BlurUp() {
  const t = useCatalogueText(MESSAGES.en);
  const [round, setRound] = useState(0);
  return (
    <View className="flex-row flex-wrap items-center gap-4">
      <Thumbnail key={round} size="lg" src={PRODUCT} placeholderSrc={PRODUCT} alt={t(K.latte)} />
      <Button size="sm" variant="secondary" onPress={() => setRound((value) => value + 1)}>
        {t(K.reload)}
      </Button>
    </View>
  );
}

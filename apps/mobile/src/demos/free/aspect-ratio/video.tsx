/**
 * Stackra file contract:
 * Purpose: the "video" demo of the native AspectRatio: a 16:9 video poster with its title and length, the space held
 *          before anything loads.
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

/** The demo's keys. */
const K = ASPECT_RATIO_DEMO_KEYS.demo_free.aspect_ratio.video;

/** AspectRatio: a 16:9 video poster. */
export default function Video() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-2">
      <AspectRatio ratio={16 / 9} className="bg-default">
        <Image
          source={{ uri: DEMO_PHOTOS[4]?.src ?? "" }}
          accessibilityLabel={t(K.title)}
          resizeMode="cover"
          style={{ width: "100%", height: "100%" }}
        />
      </AspectRatio>
      <View className="flex-row items-baseline justify-between gap-3">
        <Text className="font-medium">{t(K.title)}</Text>
        <Text type="small" tone="muted">
          {t(K.duration)}
        </Text>
      </View>
    </View>
  );
}

/**
 * Stackra file contract:
 * Purpose: the "display-only" demo of the native PageIndicator: dots under a product photo that only show the place
 *          (the third of five), announced as one image.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { AspectRatio, PageIndicator, useCatalogueText } from "@stackra/ui/native";
import { Image, View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DEMO_PHOTOS } from "#src/demos/free/gallery/demo-photos.constant";
import { PAGE_INDICATOR_DEMO_KEYS } from "#src/demos/free/page-indicator/page-indicator-demo-keys.constant";

/** The demo's keys. */
const K = PAGE_INDICATOR_DEMO_KEYS.demo_free.page_indicator.display_only;

/** PageIndicator: display only. */
export default function DisplayOnly() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="items-center gap-3">
      <AspectRatio ratio={4 / 3} className="bg-default">
        <Image
          source={{ uri: DEMO_PHOTOS[2]?.src ?? "" }}
          accessibilityLabel={t(K.caption)}
          resizeMode="cover"
          style={{ width: "100%", height: "100%" }}
        />
      </AspectRatio>
      <PageIndicator count={5} index={2} />
    </View>
  );
}

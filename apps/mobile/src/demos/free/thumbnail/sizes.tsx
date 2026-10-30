/**
 * Stackra file contract:
 * Purpose: the "sizes" demo of the native Thumbnail: the three widths, square and 4:3.
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
const K = THUMBNAIL_DEMO_KEYS.demo_free.thumbnail.sizes;

/** A one-pixel latte-brown PNG, so the sample never touches the network; React Native's Image draws no SVG. */
const PRODUCT =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNIKekGAAKjAWRgxqrsAAAAAElFTkSuQmCC";

/** Each size, square and 4:3. */
export default function Sizes() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      {[1, 4 / 3].map((ratio) => (
        <View key={ratio} className="flex-row flex-wrap items-end gap-4">
          {(["sm", "md", "lg"] as const).map((size) => (
            <Sample key={size} caption={t(K[size])}>
              <Thumbnail size={size} aspectRatio={ratio} src={PRODUCT} alt={t(K.latte)} />
            </Sample>
          ))}
        </View>
      ))}
    </View>
  );
}

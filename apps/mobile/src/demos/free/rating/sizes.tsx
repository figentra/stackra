/**
 * Stackra file contract:
 * Purpose: the "sizes" demo of the native Rating: the small, medium and large stars.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (gap build, owner approval 2026-10-31).
 */
import { Rating, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { RATING_DEMO_KEYS } from "#src/demos/free/rating/rating-demo-keys.constant";

/** The demo's keys. */
const K = RATING_DEMO_KEYS.demo_free.rating.sizes;

/** Rating: the small, medium and large stars. */
export default function Sizes() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      {(["sm", "md", "lg"] as const).map((size) => (
        <Rating key={size} size={size} label={t(K[size])} defaultValue={3} />
      ))}
    </View>
  );
}

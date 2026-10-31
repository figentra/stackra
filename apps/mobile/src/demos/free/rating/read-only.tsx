/**
 * Stackra file contract:
 * Purpose: the "read-only" demo of the native Rating: a branch's average shown read-only, with a half star.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (gap build, owner approval 2026-10-31).
 */
import { Rating, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { RATING_DEMO_KEYS } from "#src/demos/free/rating/rating-demo-keys.constant";

/** The demo's keys. */
const K = RATING_DEMO_KEYS.demo_free.rating.read_only;

/** Rating: a branch's average shown read-only, with a half star. */
export default function ReadOnly() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="flex-row items-center gap-3">
      <Rating value={4.5} isReadOnly label={t(K.branch)} />
      <Text type="small" tone="muted">
        {t(K.reviews)}
      </Text>
    </View>
  );
}

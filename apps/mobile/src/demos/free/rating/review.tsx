/**
 * Stackra file contract:
 * Purpose: the "review" demo of the native Rating: a visit's rating that people pick and can clear, with the choice written back.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (gap build, owner approval 2026-10-31).
 */
import { Rating, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { RATING_DEMO_KEYS } from "#src/demos/free/rating/rating-demo-keys.constant";

/** The demo's keys. */
const K = RATING_DEMO_KEYS.demo_free.rating.review;

/** Rating: a visit's rating that people pick and can clear. */
export default function Review() {
  const t = useCatalogueText(MESSAGES.en);
  const [stars, setStars] = useState(4);
  return (
    <View className="gap-3">
      <Rating
        label={t(K.label)}
        description={t(K.description)}
        value={stars}
        onChange={setStars}
        isClearable
        size="lg"
      />
      <Text type="small" tone="muted" accessibilityLiveRegion="polite">
        {t(K.thanks, { count: stars })}
      </Text>
    </View>
  );
}

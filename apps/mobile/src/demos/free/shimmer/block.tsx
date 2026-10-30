/**
 * Stackra file contract:
 * Purpose: the "block" demo of the native Shimmer: a question about this month's orders, with placeholder lines
 *          where the summary will appear.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { Shimmer, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SHIMMER_DEMO_KEYS } from "#src/demos/free/shimmer/shimmer-demo-keys.constant";

/** The demo's keys. */
const K = SHIMMER_DEMO_KEYS.demo_free.shimmer.block;

/** A block of four shimmering lines while an answer loads. */
export default function Block() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      <Text className="font-medium">{t(K.question)}</Text>
      <Shimmer kind="block" lines={4} />
    </View>
  );
}

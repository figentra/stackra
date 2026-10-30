/**
 * Stackra file contract:
 * Purpose: the "thinking" demo of the native Shimmer: the default "Thinking…" and a step the assistant names,
 *          each with the light sweeping in the reading direction.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { Shimmer, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SHIMMER_DEMO_KEYS } from "#src/demos/free/shimmer/shimmer-demo-keys.constant";

/** The demo's keys. */
const K = SHIMMER_DEMO_KEYS.demo_free.shimmer.thinking;

/** A plain shimmer and one that shimmers its own text. */
export default function Thinking() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="items-start gap-3">
      <Shimmer />
      <Shimmer>{t(K.searching)}</Shimmer>
    </View>
  );
}

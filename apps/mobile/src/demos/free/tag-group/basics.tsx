/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native TagGroup: a label, a label with a description, and an `accessibilityLabel` alone.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { TagItem } from "@stackra/ui/contracts";
import { TagGroup, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TAG_GROUP_DEMO_KEYS } from "#src/demos/free/tag-group/tag-group-demo-keys.constant";

/** The demo's keys. */
const T = TAG_GROUP_DEMO_KEYS.demo_free.tag_group.topics;
const K = TAG_GROUP_DEMO_KEYS.demo_free.tag_group.basics;

/** Three ways to name a group. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const topics: readonly TagItem[] = [
    { id: "news", label: t(T.news) },
    { id: "travel", label: t(T.travel) },
    { id: "gaming", label: t(T.gaming) },
    { id: "music", label: t(T.music) },
  ];
  const amenities: readonly TagItem[] = [
    { id: "laundry", label: t(K.laundry) },
    { id: "fitness", label: t(K.fitness) },
    { id: "parking", label: t(K.parking) },
    { id: "pool", label: t(K.pool) },
  ];
  return (
    <View className="gap-4">
      <TagGroup label={t(K.topics)} items={topics} />
      <TagGroup label={t(K.amenities)} description={t(K.hint)} items={amenities} />
      <TagGroup accessibilityLabel={t(K.hidden_name)} items={topics} />
    </View>
  );
}

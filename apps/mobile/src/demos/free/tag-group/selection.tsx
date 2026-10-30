/**
 * Stackra file contract:
 * Purpose: the "selection" demo of the native TagGroup: `none`, `single` keeps one tag, `multiple` toggles each.
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
const K = TAG_GROUP_DEMO_KEYS.demo_free.tag_group.selection;

/** One group per selection mode. */
export default function Selection() {
  const t = useCatalogueText(MESSAGES.en);
  const topics: readonly TagItem[] = [
    { id: "news", label: t(T.news) },
    { id: "travel", label: t(T.travel) },
    { id: "gaming", label: t(T.gaming) },
    { id: "music", label: t(T.music) },
  ];
  return (
    <View className="gap-4">
      <TagGroup label={t(K.none)} items={topics} selectionMode="none" />
      <TagGroup label={t(K.single)} items={topics} selectionMode="single" defaultValue={["news"]} />
      <TagGroup
        label={t(K.multiple)}
        items={topics}
        selectionMode="multiple"
        defaultValue={["news", "music"]}
      />
    </View>
  );
}

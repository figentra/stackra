/**
 * Stackra file contract:
 * Purpose: the "sizes" demo of the native TagGroup: each `size`, `default` on the page and `surface` on a tinted card.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Size, TagVariant, type TagItem } from "@stackra/ui/contracts";
import { Surface, TagGroup, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";
import { MESSAGES } from "#src/constants/messages.constant";
import { TAG_GROUP_DEMO_KEYS } from "#src/demos/free/tag-group/tag-group-demo-keys.constant";

/** The demo's keys. */
const T = TAG_GROUP_DEMO_KEYS.demo_free.tag_group.topics;
const K = TAG_GROUP_DEMO_KEYS.demo_free.tag_group.sizes;

/** Every size of every variant. */
export default function Sizes() {
  const t = useCatalogueText(MESSAGES.en);
  const topics: readonly TagItem[] = [
    { id: "news", label: t(T.news) },
    { id: "travel", label: t(T.travel) },
    { id: "gaming", label: t(T.gaming) },
    { id: "music", label: t(T.music) },
  ];
  return (
    <View className="gap-3">
      {Size.map((size) =>
        TagVariant.map((variant) => {
          const sample = (
            <Sample caption={t(K.size, { size, variant })}>
              <TagGroup items={topics} size={size} variant={variant} />
            </Sample>
          );
          return variant === "surface" ? (
            <Surface key={`${size}-${variant}`} variant="secondary">
              {sample}
            </Surface>
          ) : (
            <View key={`${size}-${variant}`}>{sample}</View>
          );
        }),
      )}
    </View>
  );
}

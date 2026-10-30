/**
 * Stackra file contract:
 * Purpose: the "states" demo of the native TagGroup: a refused tag, a disabled group, read-only, required, invalid, empty.
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
const K = TAG_GROUP_DEMO_KEYS.demo_free.tag_group.states;

/** Read-only keeps the selection and hides the remove buttons. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  const topics: readonly TagItem[] = [
    { id: "news", label: t(T.news) },
    { id: "travel", label: t(T.travel) },
    { id: "gaming", label: t(T.gaming) },
    { id: "music", label: t(T.music) },
  ];
  const oneDisabled: readonly TagItem[] = topics
    .slice(0, 3)
    .map((tag) => ({ ...tag, isDisabled: tag.id === "travel" }));
  return (
    <View className="gap-4">
      <TagGroup label={t(K.disabled_tag)} items={oneDisabled} selectionMode="multiple" />
      <TagGroup label={t(K.disabled_group)} items={topics} selectionMode="multiple" isDisabled />
      <TagGroup
        label={t(K.read_only)}
        items={topics}
        selectionMode="multiple"
        defaultValue={["travel"]}
        isReadOnly
        onRemove={() => undefined}
        removeLabel={(tag) => t(K.remove, { tag })}
      />
      <TagGroup label={t(K.required)} items={topics} selectionMode="multiple" isRequired />
      <TagGroup
        label={t(K.invalid)}
        items={topics}
        selectionMode="multiple"
        isInvalid
        errorMessage={t(K.invalid_error)}
      />
      <TagGroup label={t(K.empty)} items={[]} emptyMessage={t(K.empty_message)} />
    </View>
  );
}

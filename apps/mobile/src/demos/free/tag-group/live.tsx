/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native TagGroup: select tags and remove them; Restore brings removed tags back.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { TagItem } from "@stackra/ui/contracts";
import { Button, TagGroup, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TAG_GROUP_DEMO_KEYS } from "#src/demos/free/tag-group/tag-group-demo-keys.constant";

/** The demo's keys. */
const K = TAG_GROUP_DEMO_KEYS.demo_free.tag_group.live;

/** The page reports what is selected and what is removed. */
export default function Live() {
  const [removed, setRemoved] = useState<readonly string[]>([]);
  const [selected, setSelected] = useState<readonly string[]>([]);
  const t = useCatalogueText(MESSAGES.en);
  const filters: readonly TagItem[] = [
    { id: "open", label: t(K.open) },
    { id: "mine", label: t(K.mine) },
    { id: "urgent", label: t(K.urgent) },
    { id: "recent", label: t(K.recent) },
  ];
  const list = (keys: readonly string[]) => (keys.length === 0 ? t(K.none) : keys.join(", "));
  return (
    <View className="items-start gap-3">
      <TagGroup
        label={t(K.label)}
        items={filters.filter((tag) => !removed.includes(tag.id))}
        selectionMode="multiple"
        value={selected}
        onChange={setSelected}
        onRemove={(keys) => {
          setRemoved((current) => [...current, ...keys]);
          setSelected((current) => current.filter((key) => !keys.includes(key)));
        }}
        removeLabel={(tag) => t(K.remove, { tag })}
      />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {t(K.selected, { keys: list(selected) })}
      </Text>
      <Text tone="muted" accessibilityLiveRegion="polite">
        {t(K.removed, { keys: list(removed) })}
      </Text>
      <Button
        size="sm"
        variant="secondary"
        isDisabled={removed.length === 0}
        onPress={() => setRemoved([])}
      >
        {t(K.restore)}
      </Button>
    </View>
  );
}

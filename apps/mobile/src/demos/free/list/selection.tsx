/**
 * Stackra file contract:
 * Purpose: the "selection" demo of the native List: `selectionMode` single or multiple; a selected row shows a check.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { ListItemData } from "@stackra/ui/contracts";
import { List, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { LIST_DEMO_KEYS } from "#src/demos/free/list/list-demo-keys.constant";

/** The demo's keys. */
const K = LIST_DEMO_KEYS.demo_free.list.selection;

/** One delivery speed, several gift options. */
export default function Selection() {
  const [speed, setSpeed] = useState<readonly string[]>(["express"]);
  const [gifts, setGifts] = useState<readonly string[]>([]);
  const t = useCatalogueText(MESSAGES.en);
  const speeds: readonly ListItemData[] = [
    { id: "standard", title: t(K.standard), description: t(K.standard_note) },
    { id: "express", title: t(K.express), description: t(K.express_note) },
    { id: "pickup", title: t(K.pickup), description: t(K.pickup_note) },
  ];
  const giftOptions: readonly ListItemData[] = [
    { id: "wrap", title: t(K.wrap) },
    { id: "note", title: t(K.note) },
    { id: "receipt", title: t(K.receipt) },
  ];
  const chosen = (keys: readonly string[]) =>
    keys.length === 0 ? t(K.none) : t(K.chosen, { keys: keys.join(", ") });
  return (
    <View className="gap-3">
      <List
        scrollEnabled={false}
        label={t(K.single)}
        items={speeds}
        selectionMode="single"
        selectedKeys={speed}
        onSelectionChange={setSpeed}
      />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {chosen(speed)}
      </Text>
      <List
        scrollEnabled={false}
        label={t(K.multiple)}
        items={giftOptions}
        selectionMode="multiple"
        selectedKeys={gifts}
        onSelectionChange={setGifts}
      />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {chosen(gifts)}
      </Text>
    </View>
  );
}

/**
 * Stackra file contract:
 * Purpose: the "empty" demo of the native PropertyList: missing, empty or `false` show `emptyValue`; `0` is a value.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { PropertyListItem } from "@stackra/ui/contracts";
import { PropertyList, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { PROPERTY_LIST_DEMO_KEYS } from "#src/demos/free/property-list/property-list-demo-keys.constant";

/** The demo's keys. */
const K = PROPERTY_LIST_DEMO_KEYS.demo_free.property_list.empty;

/** A dash by default, then words instead. */
export default function Empty() {
  const t = useCatalogueText(MESSAGES.en);
  const items: readonly PropertyListItem[] = [
    { id: "company", label: t(K.company) },
    { id: "note", label: t(K.note), value: "" },
    { id: "gift", label: t(K.gift), value: false },
    { id: "discount", label: t(K.discount), value: 0 },
  ];
  return (
    <View className="gap-3">
      <PropertyList items={items} />
      <Text type="small" tone="muted">
        {t(K.custom)}
      </Text>
      <PropertyList items={items.slice(0, 2)} emptyValue={t(K.not_set)} />
    </View>
  );
}

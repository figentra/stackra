/**
 * Stackra file contract:
 * Purpose: the "copy" demo of the native PropertyList: a row with `copyLabel` gets a copy button once the list has `onCopy`.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { PropertyListItem } from "@stackra/ui/contracts";
import { PropertyList, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { PROPERTY_LIST_DEMO_KEYS } from "#src/demos/free/property-list/property-list-demo-keys.constant";

/** The demo's keys. */
const K = PROPERTY_LIST_DEMO_KEYS.demo_free.property_list.copy;

/** The app writes the clipboard in `onCopy`; here the readout shows what would be copied. */
export default function Copy() {
  const [copied, setCopied] = useState<string | null>(null);
  const t = useCatalogueText(MESSAGES.en);
  const items: readonly PropertyListItem[] = [
    { id: "id", label: t(K.order_id), value: "ord_01H2J3K4L5M6N7P8Q9R0", copyLabel: t(K.copy_id) },
    { id: "email", label: t(K.email), value: "ada@example.com", copyLabel: t(K.copy_email) },
  ];
  return (
    <View className="gap-3">
      <PropertyList items={items} onCopy={(_item, text) => setCopied(text)} />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {copied === null ? t(K.none) : t(K.copied, { text: copied })}
      </Text>
    </View>
  );
}

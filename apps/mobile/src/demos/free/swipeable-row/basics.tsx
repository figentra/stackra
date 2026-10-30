/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Swipeable row: two orders that slide aside to pin, archive or delete.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { SwipeAction } from "@stackra/ui/contracts";
import { SwipeableRow, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { SWIPEABLE_ROW_DEMO_KEYS } from "#src/demos/free/swipeable-row/swipeable-row-demo-keys.constant";

/** The demo's keys. */
const K = SWIPEABLE_ROW_DEMO_KEYS.demo_free.swipeable_row.sample;

/** Swipeable row: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [last, setLast] = useState<string | undefined>(undefined);
  const start: readonly SwipeAction[] = [
    { id: "pin", label: t(K.pin), icon: Icons.Pin, tone: "accent" },
  ];
  const end: readonly SwipeAction[] = [
    { id: "archive", label: t(K.archive), icon: Icons.Archive, tone: "warning" },
    { id: "delete", label: t(K.delete), icon: Icons.Trash, tone: "danger" },
  ];
  const labelOf = (id: string) => [...start, ...end].find((action) => action.id === id)?.label;
  return (
    <View className="gap-3">
      <Text type="small" tone="muted" accessibilityLiveRegion="polite">
        {last === undefined ? t(K.hint) : t(K.chosen, { action: last })}
      </Text>
      {[t(K.huda), t(K.omar)].map((title) => (
        <View key={title} className="overflow-hidden rounded-[var(--radius-container)]">
          <SwipeableRow
            startActions={start}
            endActions={end}
            onAction={(id) => setLast(labelOf(id))}
          >
            <View className="px-4 py-3">
              <Text className="font-medium">{title}</Text>
            </View>
          </SwipeableRow>
        </View>
      ))}
    </View>
  );
}

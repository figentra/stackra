/**
 * Stackra file contract:
 * Purpose: the "speed-dial" demo of the native Floating action button: a plus that fans out three related actions; the last chosen shows above.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { FabAction } from "@stackra/ui/contracts";
import { Fab, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { FAB_DEMO_KEYS } from "#src/demos/free/fab/fab-demo-keys.constant";

/** The demo's keys. */
const K = FAB_DEMO_KEYS.demo_free.fab.sample;

/** Floating action button: Speed dial. */
export default function SpeedDial() {
  const t = useCatalogueText(MESSAGES.en);
  const [chosen, setChosen] = useState<string | undefined>(undefined);
  const actions: readonly FabAction[] = [
    { id: "scan", label: t(K.scan), icon: Icons.ScanLine },
    { id: "note", label: t(K.note), icon: Icons.Pencil },
    { id: "photo", label: t(K.photo), icon: Icons.Camera },
  ];
  return (
    <View className="h-80 rounded-2xl border border-dashed border-border p-4">
      <Text type="small" tone="muted" accessibilityLiveRegion="polite">
        {chosen === undefined ? t(K.nothing_chosen) : t(K.chosen, { action: chosen })}
      </Text>
      <Fab
        label={t(K.create)}
        actions={actions}
        onAction={(id) => setChosen(actions.find((action) => action.id === id)?.label)}
      />
    </View>
  );
}

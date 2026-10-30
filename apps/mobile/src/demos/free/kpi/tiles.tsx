/**
 * Stackra file contract:
 * Purpose: the "tiles" demo of the native Kpi: tiles with icons and drill-down.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (wave 3b).
 */
import { Kpi, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { KPI_DEMO_KEYS } from "#src/demos/free/kpi/kpi-demo-keys.constant";

/** The demo's keys. */
const K = KPI_DEMO_KEYS.demo_free.kpi.tiles;

/** Tiles with an icon; pressing one drills in. */
export default function Tiles() {
  const t = useCatalogueText(MESSAGES.en);
  const [opened, setOpened] = useState("");
  return (
    <View className="gap-3">
      <Kpi
        icon="wallet"
        label={t(K.revenue)}
        value={184_200}
        trend={0.124}
        comparison={t(K.vs_last)}
        onPress={() => setOpened(t(K.revenue))}
      />
      <Kpi
        icon="users"
        label={t(K.customers)}
        value={312}
        trend={-0.04}
        onPress={() => setOpened(t(K.customers))}
      />
      <Text type="small" tone="muted">
        {opened ? t(K.opened, { name: opened }) : ""}
      </Text>
    </View>
  );
}

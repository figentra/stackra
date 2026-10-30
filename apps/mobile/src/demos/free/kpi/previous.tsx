/**
 * Stackra file contract:
 * Purpose: the "previous" demo of the native Kpi: tiles compared with the previous period (the trend worked out from
 *          `previousValue`), each opening its detail when pressed.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371.
 */
import { Kpi, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { KPI_DEMO_KEYS } from "#src/demos/free/kpi/kpi-demo-keys.constant";

/** The demo's keys. */
const K = KPI_DEMO_KEYS.demo_free.kpi.previous;

/** This period against the previous one, with drill-down. */
export default function Previous() {
  const t = useCatalogueText(MESSAGES.en);
  const [opened, setOpened] = useState("");
  return (
    <View className="gap-3">
      <Kpi
        icon="wallet"
        label={t(K.revenue)}
        value={184_200}
        previousValue={163_900}
        onPress={() => setOpened(t(K.revenue))}
      />
      <Kpi
        icon="shopping-cart"
        label={t(K.orders)}
        value={1284}
        previousValue={1340}
        onPress={() => setOpened(t(K.orders))}
      />
      <Kpi
        icon="receipt"
        label={t(K.refunds)}
        value={42}
        previousValue={57}
        better="down"
        onPress={() => setOpened(t(K.refunds))}
      />
      <Text type="small" tone="muted">
        {opened ? t(K.opened, { name: opened }) : ""}
      </Text>
    </View>
  );
}

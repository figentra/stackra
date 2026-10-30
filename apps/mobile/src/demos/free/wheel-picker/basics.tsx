/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Wheel picker: Basics.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); wave 3a forms and pickers
 *          (owner approval 2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { Text, WheelPicker, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { WHEEL_PICKER_DEMO_KEYS } from "#src/demos/free/wheel-picker/wheel-picker-demo-keys.constant";

/** The demo's keys. */
const K = WHEEL_PICKER_DEMO_KEYS.demo_free.wheel_picker.basics;

/** Wheel picker: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [order, setOrder] = useState<Readonly<Record<string, string>>>({
    size: "medium",
    milk: "oat",
  });
  return (
    <View className="gap-4">
      <WheelPicker
        label={t(K.label)}
        columns={[
          {
            id: "size",
            label: t(K.size),
            items: [
              { id: "small", label: t(K.small) },
              { id: "medium", label: t(K.medium) },
              { id: "large", label: t(K.large) },
            ],
          },
          {
            id: "milk",
            label: t(K.milk),
            items: [
              { id: "full", label: t(K.full) },
              { id: "oat", label: t(K.oat) },
              { id: "none", label: t(K.none) },
            ],
          },
        ]}
        value={order}
        onChange={setOrder}
      />
      <Text tone="muted">
        {t(K.chosen, { size: t(K[order["size"] as "small"]), milk: t(K[order["milk"] as "full"]) })}
      </Text>
    </View>
  );
}

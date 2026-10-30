/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Drop zone: Basics.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); wave 3a forms and pickers
 *          (owner approval 2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { DropZone, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { DROP_ZONE_DEMO_KEYS } from "#src/demos/free/drop-zone/drop-zone-demo-keys.constant";

/** The demo's keys. */
const K = DROP_ZONE_DEMO_KEYS.demo_free.drop_zone.basics;

/** Drop zone: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [count, setCount] = useState(0);
  return (
    <View className="gap-4">
      <DropZone
        label={t(K.label)}
        description={t(K.hint)}
        acceptedFileTypes={["image/png", "image/jpeg"]}
        allowsMultiple
        onSelect={(files) => setCount(files.length)}
      />
      <Text tone="muted">{t(K.count, { count })}</Text>
    </View>
  );
}

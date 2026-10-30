/**
 * Stackra file contract:
 * Purpose: the "horizontal" demo of the native Separator: between two paragraphs, the full width of the container.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Separator, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SEPARATOR_DEMO_KEYS } from "#src/demos/free/separator/separator-demo-keys.constant";

/** The demo's keys. */
const K = SEPARATOR_DEMO_KEYS.demo_free.separator.paragraphs;

/** A rule between two paragraphs. */
export default function Horizontal() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      <Text>{t(K.before)}</Text>
      <Separator />
      <Text>{t(K.after)}</Text>
    </View>
  );
}

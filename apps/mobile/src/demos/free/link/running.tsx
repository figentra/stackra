/**
 * Stackra file contract:
 * Purpose: the "running" demo of the native Link: inside a paragraph it stays underlined, so colour alone does not mark it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Link, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { LINK_DEMO_KEYS } from "#src/demos/free/link/link-demo-keys.constant";

/** The demo's keys. */
const K = LINK_DEMO_KEYS.demo_free.link.running;

/** A link between two runs of text. */
export default function Running() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="flex-row flex-wrap items-center gap-1">
      <Text>{t(K.before)}</Text>
      <Link href="https://heroui.com">{t(K.link)}</Link>
      <Text>{t(K.after)}</Text>
    </View>
  );
}

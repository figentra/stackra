/**
 * Stackra file contract:
 * Purpose: the "chips" demo of the native Sources: single citation chips under a line of text.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (component gaps, owner approval 2026-10-31).
 */
import { SourceChip, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SOURCES_DEMO_KEYS } from "#src/demos/free/sources/sources-demo-keys.constant";

/** The demo's keys. */
const K = SOURCES_DEMO_KEYS.demo_free.sources.chips;

/** Sources: single citation chips under a line of text. */
export default function Chips() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-2">
      <Text>{t(K.before)}</Text>
      <SourceChip source={{ key: "news", href: "https://www.example.com/fees" }} />
      <Text>{t(K.after)}</Text>
      <SourceChip source={{ key: "zones", title: "zones-2026.pdf" }} />
    </View>
  );
}

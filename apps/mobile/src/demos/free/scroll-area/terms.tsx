/**
 * Stackra file contract:
 * Purpose: the "terms" demo of the native Scroll area: delivery terms that scroll inside a bounded box.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { ScrollArea, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SCROLL_AREA_DEMO_KEYS } from "#src/demos/free/scroll-area/scroll-area-demo-keys.constant";

/** The demo's keys. */
const K = SCROLL_AREA_DEMO_KEYS.demo_free.scroll_area.terms;

/** Scroll area: delivery terms that scroll inside a bounded box. */
export default function Terms() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View>
      <ScrollArea label={t(K.label)} maxSize={200}>
        <View className="gap-3 p-4">
          {[K.p1, K.p2, K.p3, K.p4, K.p5].map((key) => (
            <Text key={key}>{t(key)}</Text>
          ))}
        </View>
      </ScrollArea>
    </View>
  );
}

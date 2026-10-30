/**
 * Stackra file contract:
 * Purpose: the "chips" demo of the native Scroll area: a row of category chips that scrolls sideways.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Chip, ScrollArea, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SCROLL_AREA_DEMO_KEYS } from "#src/demos/free/scroll-area/scroll-area-demo-keys.constant";

/** The demo's keys. */
const K = SCROLL_AREA_DEMO_KEYS.demo_free.scroll_area.chips;

/** Scroll area: a row of category chips that scrolls sideways. */
export default function Chips() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View>
      <ScrollArea label={t(K.label)} orientation="horizontal">
        <View className="flex-row gap-2 p-1">
          {[K.all, K.dates, K.coffee, K.perfume, K.abayas, K.spices, K.sweets, K.gifts].map(
            (key) => (
              <Chip key={key} variant="soft">
                {t(key)}
              </Chip>
            ),
          )}
        </View>
      </ScrollArea>
    </View>
  );
}

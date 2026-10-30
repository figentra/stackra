/**
 * Stackra file contract:
 * Purpose: the "counter" demo of the native NumberTicker: a sales count that counts on from where it stands each time
 *          a sale is recorded, in the app's digits.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); ADR 0329.
 */
import { Button, NumberTicker, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { NUMBER_TICKER_DEMO_KEYS } from "#src/demos/free/number-ticker/number-ticker-demo-keys.constant";

/** The demo's keys. */
const K = NUMBER_TICKER_DEMO_KEYS.demo_free.number_ticker.counter;

/** Record a sale; the figure counts on. */
export default function Counter() {
  const t = useCatalogueText(MESSAGES.en);
  const [sales, setSales] = useState(1280);
  return (
    <View className="items-start gap-3">
      <Text tone="muted">{t(K.sales)}</Text>
      <NumberTicker value={sales} />
      <View className="flex-row flex-wrap gap-2">
        <Button size="sm" variant="secondary" onPress={() => setSales((count) => count + 37)}>
          {t(K.add)}
        </Button>
        <Button size="sm" variant="ghost" onPress={() => setSales(0)}>
          {t(K.reset)}
        </Button>
      </View>
    </View>
  );
}

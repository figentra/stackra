/**
 * Stackra file contract:
 * Purpose: the "compact" demo of the native Number value: large figures in compact form, in dirhams and dinars.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { MoneyValue, NumberValue, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { NUMBER_VALUE_DEMO_KEYS } from "#src/demos/free/number-value/number-value-demo-keys.constant";

/** The demo's keys. */
const K = NUMBER_VALUE_DEMO_KEYS.demo_free.number_value.compact;

/** Number value: large figures in compact form, in dirhams and dinars. */
export default function Compact() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View>
      <View className="gap-2">
        <Text tone="muted">{t(K.note)}</Text>
        <View className="flex-row flex-wrap gap-6">
          <MoneyValue amount={2_450_000} currency="AED" isCompact />
          <NumberValue value={1_250_000} options={{ notation: "compact" }} />
          <MoneyValue amount={89.5} currency="KWD" currencyDisplay="code" />
        </View>
      </View>
    </View>
  );
}

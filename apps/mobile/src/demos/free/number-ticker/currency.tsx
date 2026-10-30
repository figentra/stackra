/**
 * Stackra file contract:
 * Purpose: the "currency" demo of the native NumberTicker: a month's revenue counting up from zero as money, with the
 *          currency and decimals set by `format`.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); ADR 0329.
 */
import { NumberTicker, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { NUMBER_TICKER_DEMO_KEYS } from "#src/demos/free/number-ticker/number-ticker-demo-keys.constant";

/** The demo's keys. */
const K = NUMBER_TICKER_DEMO_KEYS.demo_free.number_ticker.currency;

/** Riyals with two decimals. */
const MONEY = { style: "currency", currency: "SAR", minimumFractionDigits: 2 } as const;

/** Revenue counting up as money. */
export default function Currency() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="items-start gap-2">
      <Text tone="muted">{t(K.revenue)}</Text>
      <NumberTicker value={48_215.5} duration={1400} format={MONEY} />
    </View>
  );
}

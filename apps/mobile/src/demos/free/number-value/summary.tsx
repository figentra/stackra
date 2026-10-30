/**
 * Stackra file contract:
 * Purpose: the "summary" demo of the native Number value: a month's revenue, orders, growth and export size.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import {
  BytesValue,
  MoneyValue,
  NumberValue,
  PercentValue,
  Text,
  useCatalogueText,
} from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { NUMBER_VALUE_DEMO_KEYS } from "#src/demos/free/number-value/number-value-demo-keys.constant";

/** The demo's keys. */
const K = NUMBER_VALUE_DEMO_KEYS.demo_free.number_value.summary;

/** Number value: a month's revenue, orders, growth and export size. */
export default function Summary() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View>
      <View className="gap-2">
        <Text tone="muted">{t(K.revenue)}</Text>
        <MoneyValue amount={1_284_500.75} currency="SAR" />
        <Text tone="muted">{t(K.orders)}</Text>
        <NumberValue value={18_342} />
        <Text tone="muted">{t(K.growth)}</Text>
        <PercentValue value={0.124} fractionDigits={1} showSign />
        <Text tone="muted">{t(K.export)}</Text>
        <BytesValue value={48_200_000} />
      </View>
    </View>
  );
}

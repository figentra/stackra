/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native MoneyField: a POS item price in riyals, held in halalas.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); gap inventory row 2; ADR 0310
 *          (decision 6).
 */
import { MoneyField, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { MONEY_FIELD_DEMO_KEYS } from "#src/demos/free/money-field/money-field-demo-keys.constant";

/** The demo's keys. */
const K = MONEY_FIELD_DEMO_KEYS.demo_free.money_field.basics;

/** A price; the stored minor units show under it. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [price, setPrice] = useState<number | null>(2450);
  return (
    <View className="gap-3">
      <MoneyField
        label={t(K.price)}
        description={t(K.price_hint)}
        currency="SAR"
        value={price}
        onChange={setPrice}
        minValue={0}
      />
      <Text tone="muted" type="small" accessibilityLiveRegion="polite">
        {t(K.stored, { minor: price ?? 0 })}
      </Text>
    </View>
  );
}

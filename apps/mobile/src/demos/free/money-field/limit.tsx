/**
 * Stackra file contract:
 * Purpose: the "limit" demo of the native MoneyField: a refund capped at the amount paid; going past it shakes and buzzes.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); gap inventory row 2; ADR 0310
 *          (decision 6).
 */
import { MoneyField, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { MONEY_FIELD_DEMO_KEYS } from "#src/demos/free/money-field/money-field-demo-keys.constant";

/** The demo's keys. */
const K = MONEY_FIELD_DEMO_KEYS.demo_free.money_field.limit;

/** What the customer paid on the order, in halalas. */
const PAID = 15_000;

/** A refund that cannot pass what was paid. */
export default function Limit() {
  const t = useCatalogueText(MESSAGES.en);
  const [refund, setRefund] = useState<number | null>(14_500);
  return (
    <MoneyField
      label={t(K.refund)}
      description={t(K.refund_hint)}
      currency="SAR"
      value={refund}
      onChange={setRefund}
      minValue={0}
      maxValue={PAID}
      step={500}
    />
  );
}

/**
 * Stackra file contract:
 * Purpose: the "limit" demo of the web MoneyField: a refund capped at the amount paid; going past it shakes the field.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); gap inventory row 2; ADR 0060
 *          (light, dark, RTL).
 */
import { MoneyField as UiMoneyField, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { MONEY_FIELD_KEYS } from "#src/demos/free/money-field/money-field-keys.constant";

/** The demo's keys. */
const K = MONEY_FIELD_KEYS.money_field;

/** What the customer paid on the order, in halalas. */
const PAID = 15_000;

/** Money field: Over the limit. */
export default function Limit() {
  const t = useCatalogueText(MESSAGES.en);
  const [refund, setRefund] = useState<number | null>(14_500);
  return (
    <div className="max-w-sm">
      <UiMoneyField
        label={t(K.refund)}
        description={t(K.refund_hint)}
        currency="SAR"
        value={refund}
        onChange={setRefund}
        minValue={0}
        maxValue={PAID}
        step={500}
      />
    </div>
  );
}

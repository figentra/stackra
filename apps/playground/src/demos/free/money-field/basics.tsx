/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web MoneyField: a POS item price in riyals, held in halalas.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); gap inventory row 2; ADR 0060
 *          (light, dark, RTL).
 */
import { MoneyField as UiMoneyField, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { MONEY_FIELD_KEYS } from "#src/demos/free/money-field/money-field-keys.constant";

/** The demo's keys. */
const K = MONEY_FIELD_KEYS.money_field;

/** Money field: Price. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [price, setPrice] = useState<number | null>(2450);
  return (
    <div className="grid max-w-sm gap-3">
      <UiMoneyField
        label={t(K.price)}
        description={t(K.price_hint)}
        currency="SAR"
        value={price}
        onChange={setPrice}
        minValue={0}
      />
      <Text tone="muted" type="small" aria-live="polite">
        {t(K.stored, { minor: price ?? 0 })}
      </Text>
    </div>
  );
}

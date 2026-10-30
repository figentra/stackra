/**
 * Stackra file contract:
 * Purpose: the "currencies" demo of the web MoneyField: a supplier payment with a currency picker, KWD showing three decimals.
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

/** The currencies a Gulf supplier is paid in. */
const CURRENCIES = ["SAR", "AED", "KWD", "USD"] as const;

/** Money field: Currency picker. */
export default function Currencies() {
  const t = useCatalogueText(MESSAGES.en);
  const [currency, setCurrency] = useState<string>("KWD");
  const [amount, setAmount] = useState<number | null>(125_500);
  return (
    <div className="max-w-md">
      <UiMoneyField
        label={t(K.amount)}
        description={t(K.currency_hint)}
        currency={currency}
        currencies={CURRENCIES}
        currencyLabel={t(K.currency)}
        onCurrencyChange={setCurrency}
        value={amount}
        onChange={setAmount}
        minValue={0}
      />
    </div>
  );
}

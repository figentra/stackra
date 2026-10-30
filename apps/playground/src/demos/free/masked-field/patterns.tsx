/**
 * Stackra file contract:
 * Purpose: the "patterns" demo of the web MaskedField: a Saudi mobile number, an IBAN, a card number, an expiry date and a plate, each written into its pattern as it is typed.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave C, owner request 2026-10-29).
 */
import { MaskedField, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { MASKED_FIELD_KEYS } from "#src/demos/free/masked-field/masked-field-keys.constant";

/** The demo's keys. */
const K = MASKED_FIELD_KEYS.masked_field.patterns;

/** MaskedField: common patterns. */
export default function Patterns() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid w-full max-w-sm gap-4">
      <MaskedField label={t(K.mobile)} mask="999 999 9999" placeholder="05x xxx xxxx" />
      <MaskedField
        label={t(K.iban)}
        mask="AA99 9999 9999 9999 9999 9999"
        defaultValue="SA0380000000608010167519"
      />
      <MaskedField label={t(K.card)} mask="9999 9999 9999 9999" />
      <MaskedField label={t(K.expiry)} mask="99/99" placeholder="MM/YY" />
      <MaskedField label={t(K.plate)} mask="9999 AAA" />
    </div>
  );
}

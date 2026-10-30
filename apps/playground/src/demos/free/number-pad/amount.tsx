/**
 * Stackra file contract:
 * Purpose: the "amount" demo of the web Number pad: a POS amount with a decimal point; the keyboard types too.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL).
 */
import { NumberPad, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { NUMBER_PAD_KEYS } from "#src/demos/free/number-pad/number-pad-keys.constant";

/** The demo's keys. */
const K = NUMBER_PAD_KEYS.number_pad;

/** Number pad: Amount. */
export default function Amount() {
  const t = useCatalogueText(MESSAGES.en);
  return <NumberPad label={t(K.amount)} hasDecimal maxLength={8} className="w-72" />;
}

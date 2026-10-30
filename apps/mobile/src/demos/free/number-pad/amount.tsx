/**
 * Stackra file contract:
 * Purpose: the "amount" demo of the native Number pad: a POS amount with a decimal point.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { NumberPad, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { NUMBER_PAD_DEMO_KEYS } from "#src/demos/free/number-pad/number-pad-demo-keys.constant";

/** The demo's keys. */
const K = NUMBER_PAD_DEMO_KEYS.demo_free.number_pad.sample;

/** Number pad: Amount. */
export default function Amount() {
  const t = useCatalogueText(MESSAGES.en);
  return <NumberPad label={t(K.amount)} hasDecimal maxLength={8} />;
}

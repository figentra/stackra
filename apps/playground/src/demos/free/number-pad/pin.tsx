/**
 * Stackra file contract:
 * Purpose: the "pin" demo of the web Number pad: a four-digit staff PIN that reports itself complete.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL).
 */
import { NumberPad, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { NUMBER_PAD_KEYS } from "#src/demos/free/number-pad/number-pad-keys.constant";

/** The demo's keys. */
const K = NUMBER_PAD_KEYS.number_pad;

/** Number pad: PIN. */
export default function Pin() {
  const t = useCatalogueText(MESSAGES.en);
  const [pin, setPin] = useState("");
  return (
    <div className="grid w-72 gap-3">
      <Text type="small" tone="muted" aria-live="polite" className="text-center">
        {pin.length === 4 ? t(K.complete) : t(K.enter)}
      </Text>
      <NumberPad label={t(K.pin)} isPin value={pin} onChange={setPin} />
    </div>
  );
}

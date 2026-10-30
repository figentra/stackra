/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Slide to confirm: charge a sale and close a shift, each with a way to start again.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL).
 */
import { Button, SlideToConfirm, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SLIDE_TO_CONFIRM_KEYS } from "#src/demos/free/slide-to-confirm/slide-to-confirm-keys.constant";

/** The demo's keys. */
const K = SLIDE_TO_CONFIRM_KEYS.slide_to_confirm;

/** Slide to confirm: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [round, setRound] = useState(0);
  return (
    <div className="grid w-full max-w-sm gap-3">
      <SlideToConfirm key={`charge-${round}`} label={t(K.charge)} confirmedLabel={t(K.charged)} />
      <SlideToConfirm
        key={`close-${round}`}
        variant="danger"
        label={t(K.close)}
        confirmedLabel={t(K.closed)}
      />
      <Button variant="ghost" startIcon="rotate-ccw" onPress={() => setRound((value) => value + 1)}>
        {t(K.reset)}
      </Button>
    </div>
  );
}

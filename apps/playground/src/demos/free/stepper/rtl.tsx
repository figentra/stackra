/**
 * Stackra file contract:
 * Purpose: the "rtl" demo of the web Stepper: an Arabic checkout: the steps run from the right and the connectors fill towards the left.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (owner request 2026-10-29).
 */
import { Stepper, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { STEPPER_KEYS } from "#src/demos/free/stepper/stepper-keys.constant";

/** The demo's keys. */
const K = STEPPER_KEYS.stepper.rtl;

/** Stepper: right to left. */
export default function Rtl() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div dir="rtl" lang="ar" className="w-full max-w-xl">
      <Stepper
        label={t(K.label)}
        currentStep="payment"
        steps={[
          { id: "cart", label: t(K.cart) },
          { id: "shipping", label: t(K.shipping) },
          { id: "payment", label: t(K.payment) },
          { id: "review", label: t(K.review) },
        ]}
      />
    </div>
  );
}

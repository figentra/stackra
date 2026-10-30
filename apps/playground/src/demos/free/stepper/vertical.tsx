/**
 * Stackra file contract:
 * Purpose: the "vertical" demo of the web Stepper: setting up a store, down the side: a line under each step, an optional step, and icon markers.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (owner request 2026-10-29).
 */
import { Stepper, useCatalogueText } from "@stackra/ui/react";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { STEPPER_KEYS } from "#src/demos/free/stepper/stepper-keys.constant";

/** The demo's keys. */
const K = STEPPER_KEYS.stepper.vertical;

/** Stepper: store setup down the side. */
export default function Vertical() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Stepper
      label={t(K.label)}
      orientation="vertical"
      marker="icon"
      currentStep="payments"
      steps={[
        { id: "profile", label: t(K.profile), description: t(K.profile_note), icon: Icons.Store },
        {
          id: "products",
          label: t(K.products),
          description: t(K.products_note),
          icon: Icons.Package,
        },
        {
          id: "payments",
          label: t(K.payments),
          description: t(K.payments_note),
          icon: Icons.CreditCard,
        },
        { id: "domain", label: t(K.domain), icon: Icons.Globe, status: "optional" },
        { id: "launch", label: t(K.launch), icon: Icons.Rocket },
      ]}
    />
  );
}

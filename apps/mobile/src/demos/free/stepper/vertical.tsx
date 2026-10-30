/**
 * Stackra file contract:
 * Purpose: the "vertical" demo of the native Stepper: setting up a store, down the side: a line under each step and an optional step.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (owner request 2026-10-29).
 */
import { Stepper, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { STEPPER_DEMO_KEYS } from "#src/demos/free/stepper/stepper-demo-keys.constant";

/** The demo's keys. */
const K = STEPPER_DEMO_KEYS.demo_free.stepper.vertical;

/** Stepper: store setup down the side. */
export default function Vertical() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View>
      <Stepper
        label={t(K.label)}
        orientation="vertical"
        currentStep="payments"
        steps={[
          { id: "profile", label: t(K.profile), description: t(K.profile_note) },
          { id: "products", label: t(K.products), description: t(K.products_note) },
          { id: "payments", label: t(K.payments), description: t(K.payments_note) },
          { id: "domain", label: t(K.domain), status: "optional" },
          { id: "launch", label: t(K.launch) },
        ]}
      />
    </View>
  );
}

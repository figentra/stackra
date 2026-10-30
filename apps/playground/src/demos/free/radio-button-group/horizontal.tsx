/**
 * Stackra file contract:
 * Purpose: the "horizontal" demo of the web Radio cards: Side by side.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); wave 3a forms and pickers
 *          (owner approval 2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { RadioButtonGroup, useCatalogueText } from "@stackra/ui/react";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { RADIO_BUTTON_GROUP_KEYS } from "#src/demos/free/radio-button-group/radio-button-group-keys.constant";

/** The demo's keys. */
const K = RADIO_BUTTON_GROUP_KEYS.radio_button_group.horizontal;

/** Radio cards: Side by side. */
export default function Horizontal() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-4">
      <RadioButtonGroup
        label={t(K.label)}
        orientation="horizontal"
        defaultValue="pickup"
        items={[
          { id: "pickup", label: t(K.pickup), icon: Icons.ShoppingBag },
          { id: "delivery", label: t(K.delivery), icon: Icons.Truck },
        ]}
      />
    </div>
  );
}

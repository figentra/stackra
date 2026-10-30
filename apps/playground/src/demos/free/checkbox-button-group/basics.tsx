/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Checkbox cards: Basics.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); wave 3a forms and pickers
 *          (owner approval 2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { CheckboxButtonGroup, useCatalogueText } from "@stackra/ui/react";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { CHECKBOX_BUTTON_GROUP_KEYS } from "#src/demos/free/checkbox-button-group/checkbox-button-group-keys.constant";

/** The demo's keys. */
const K = CHECKBOX_BUTTON_GROUP_KEYS.checkbox_button_group.basics;

/** Checkbox cards: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-4">
      <CheckboxButtonGroup
        label={t(K.label)}
        description={t(K.hint)}
        defaultValue={["store"]}
        items={[
          { id: "store", label: t(K.store), description: t(K.store_line), icon: Icons.Store },
          { id: "online", label: t(K.online), description: t(K.online_line), icon: Icons.Globe },
          {
            id: "apps",
            label: t(K.apps),
            description: t(K.apps_line),
            icon: Icons.Bike,
            isDisabled: true,
          },
        ]}
      />
    </div>
  );
}

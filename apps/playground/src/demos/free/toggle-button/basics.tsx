/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Toggle button: a mute and a favourite toggle, alone.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL).
 */
import { Icon, ToggleButton, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TOGGLE_BUTTON_KEYS } from "#src/demos/free/toggle-button/toggle-button-keys.constant";

/** The demo's keys. */
const K = TOGGLE_BUTTON_KEYS.toggle_button;

/** Toggle button: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="flex gap-3">
      <ToggleButton>
        <Icon name="bell" />
        {t(K.mute)}
      </ToggleButton>
      <ToggleButton isIconOnly variant="ghost" aria-label={t(K.favourite)}>
        <Icon name="heart" />
      </ToggleButton>
    </div>
  );
}

/**
 * Stackra file contract:
 * Purpose: the "unnamed" demo of the web Switch: A switch with no label takes an accessible name instead, as an icon
 *          toggle does.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL).
 */
import { Switch as UiSwitch, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SWITCH_KEYS } from "#src/demos/free/switch/switch-keys.constant";

/** The demo's keys. */
const K = SWITCH_KEYS.switch;

/** Switch: Without a visible label. */
export default function Unnamed() {
  const t = useCatalogueText(MESSAGES.en);
  return <UiSwitch aria-label={t(K.unnamed_name)} />;
}

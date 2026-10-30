/**
 * Stackra file contract:
 * Purpose: the "disabled" demo of the native ModeSwitch: `isDisabled` refuses switching.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { ModeSwitch, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { MODE_SWITCH_DEMO_KEYS } from "#src/demos/free/mode-switch/mode-switch-demo-keys.constant";

/** The demo's keys. */
const K = MODE_SWITCH_DEMO_KEYS.demo_free.mode_switch.disabled;

/** A locked switch. */
export default function Disabled() {
  const t = useCatalogueText(MESSAGES.en);
  return <ModeSwitch label={t(K.label)} isDisabled />;
}

/**
 * Stackra file contract:
 * Purpose: the "unnamed" demo of the native Switch: no visible label, an accessible name instead.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Switch, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SWITCH_DEMO_KEYS } from "#src/demos/free/switch/switch-demo-keys.constant";

/** The demo's keys. */
const K = SWITCH_DEMO_KEYS.demo_free.switch.unnamed;

/** As an icon toggle does. */
export default function Unnamed() {
  const t = useCatalogueText(MESSAGES.en);
  return <Switch accessibilityLabel={t(K.name)} />;
}

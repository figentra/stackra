/**
 * Stackra file contract:
 * Purpose: the "states" demo of the native Switch: one switch per state; each label says what it shows.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Switch, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SWITCH_DEMO_KEYS } from "#src/demos/free/switch/switch-demo-keys.constant";

/** The demo's keys. */
const K = SWITCH_DEMO_KEYS.demo_free.switch.states;

/** Off, on, disabled, read-only, required, described and invalid. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      <Switch label={t(K.off)} />
      <Switch label={t(K.on)} defaultValue />
      <Switch label={t(K.disabled)} isDisabled />
      <Switch label={t(K.disabled_on)} isDisabled defaultValue />
      <Switch label={t(K.read_only)} isReadOnly defaultValue />
      <Switch label={t(K.required)} isRequired />
      <Switch label={t(K.described)} description={t(K.description_text)} />
      <Switch label={t(K.invalid)} isInvalid errorMessage={t(K.error_text)} />
    </View>
  );
}

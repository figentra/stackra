/**
 * Stackra file contract:
 * Purpose: the "group" demo of the native Toggle button: text format with several pressed, alignment with one.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { ToggleButton, ToggleButtonGroup, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TOGGLE_BUTTON_DEMO_KEYS } from "#src/demos/free/toggle-button/toggle-button-demo-keys.constant";

/** The demo's keys. */
const K = TOGGLE_BUTTON_DEMO_KEYS.demo_free.toggle_button.sample;

/** Toggle button: Group. */
export default function Group() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="items-start gap-4">
      <ToggleButtonGroup accessibilityLabel={t(K.format)} selectionMode="multiple">
        <ToggleButton id="bold">{t(K.bold)}</ToggleButton>
        <ToggleButton id="italic">{t(K.italic)}</ToggleButton>
        <ToggleButton id="underline">{t(K.underline)}</ToggleButton>
      </ToggleButtonGroup>
      <ToggleButtonGroup
        accessibilityLabel={t(K.align)}
        selectionMode="single"
        disallowEmptySelection
        defaultSelectedKeys={["start"]}
      >
        <ToggleButton id="start">{t(K.start)}</ToggleButton>
        <ToggleButton id="center">{t(K.center)}</ToggleButton>
        <ToggleButton id="end">{t(K.end)}</ToggleButton>
      </ToggleButtonGroup>
    </View>
  );
}

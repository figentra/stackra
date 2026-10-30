/**
 * Stackra file contract:
 * Purpose: the "layouts" demo of the native RadioGroup: vertical with a second line on an option, then horizontal.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { ChoiceOption } from "@stackra/ui/contracts";
import { RadioGroup, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { RADIO_GROUP_DEMO_KEYS } from "#src/demos/free/radio-group/radio-group-demo-keys.constant";

/** The demo's keys. */
const K = RADIO_GROUP_DEMO_KEYS.demo_free.radio_group;

/** `orientation`: vertical by default, or a row. */
export default function Layouts() {
  const t = useCatalogueText(MESSAGES.en);
  const speeds: readonly ChoiceOption[] = [
    { value: "standard", label: t(K.speeds.standard), description: t(K.speeds.standard_note) },
    { value: "express", label: t(K.speeds.express) },
    { value: "overnight", label: t(K.speeds.overnight) },
  ];
  // Size letters are not translated.
  const sizes: readonly ChoiceOption[] = [
    { value: "s", label: "S" },
    { value: "m", label: "M" },
    { value: "l", label: "L" },
  ];
  return (
    <View className="gap-4">
      <RadioGroup
        label={t(K.layouts.vertical)}
        description={t(K.layouts.vertical_hint)}
        options={speeds}
        defaultValue="standard"
      />
      <RadioGroup
        label={t(K.layouts.horizontal)}
        options={sizes}
        orientation="horizontal"
        defaultValue="m"
      />
    </View>
  );
}

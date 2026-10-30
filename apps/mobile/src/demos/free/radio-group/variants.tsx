/**
 * Stackra file contract:
 * Purpose: the "variants" demo of the native RadioGroup: `primary` on the page, `secondary` on a surface.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { ChoiceOption } from "@stackra/ui/contracts";
import { RadioGroup, Surface, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { RADIO_GROUP_DEMO_KEYS } from "#src/demos/free/radio-group/radio-group-demo-keys.constant";

/** The demo's keys. */
const K = RADIO_GROUP_DEMO_KEYS.demo_free.radio_group.variants;

/** Each variant where it belongs. */
export default function Variants() {
  const t = useCatalogueText(MESSAGES.en);
  // Size letters are not translated.
  const sizes: readonly ChoiceOption[] = [
    { value: "s", label: "S" },
    { value: "m", label: "M" },
    { value: "l", label: "L" },
  ];
  return (
    <View className="gap-4">
      <RadioGroup label={t(K.primary)} options={sizes} variant="primary" defaultValue="s" />
      <Surface variant="secondary">
        <RadioGroup label={t(K.secondary)} options={sizes} variant="secondary" defaultValue="s" />
      </Surface>
    </View>
  );
}

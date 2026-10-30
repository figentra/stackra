/**
 * Stackra file contract:
 * Purpose: the "variants" demo of the native CheckboxGroup: `primary` on the page, `secondary` on a surface.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { ChoiceOption } from "@stackra/ui/contracts";
import { CheckboxGroup, Surface, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { CHECKBOX_GROUP_DEMO_KEYS } from "#src/demos/free/checkbox-group/checkbox-group-demo-keys.constant";

/** The demo's keys. */
const K = CHECKBOX_GROUP_DEMO_KEYS.demo_free.checkbox_group;

/** Each variant where it belongs. */
export default function Variants() {
  const t = useCatalogueText(MESSAGES.en);
  const days: readonly ChoiceOption[] = [
    { value: "mon", label: t(K.days.mon) },
    { value: "wed", label: t(K.days.wed) },
    { value: "fri", label: t(K.days.fri) },
  ];
  return (
    <View className="gap-4">
      <CheckboxGroup
        label={t(K.variants.primary)}
        options={days}
        variant="primary"
        defaultValue={["mon"]}
      />
      <Surface variant="secondary">
        <CheckboxGroup
          label={t(K.variants.secondary)}
          options={days}
          variant="secondary"
          defaultValue={["mon"]}
        />
      </Surface>
    </View>
  );
}

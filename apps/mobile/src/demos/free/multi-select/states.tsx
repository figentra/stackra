/**
 * Stackra file contract:
 * Purpose: the "states" demo of the native MultiSelect: a menu item's dietary tags read-only, disabled and invalid.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); gap inventory row 4; ADR 0310
 *          (decision 6).
 */
import { MultiSelect, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { MULTI_SELECT_DEMO_KEYS } from "#src/demos/free/multi-select/multi-select-demo-keys.constant";

/** The demo's keys. */
const K = MULTI_SELECT_DEMO_KEYS.demo_free.multi_select.states;

/** Read-only, disabled and invalid. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  const items = [
    { id: "halal", label: t(K.halal) },
    { id: "vegan", label: t(K.vegan) },
    { id: "gluten", label: t(K.gluten) },
    { id: "spicy", label: t(K.spicy) },
    { id: "nuts", label: t(K.nuts) },
  ];
  const remove = (label: string) => t(K.remove, { label });
  return (
    <View className="gap-4">
      <MultiSelect
        label={t(K.read_only)}
        items={items}
        removeLabel={remove}
        defaultValue={["halal", "spicy"]}
        isReadOnly
      />
      <MultiSelect
        label={t(K.disabled)}
        items={items}
        removeLabel={remove}
        defaultValue={["vegan"]}
        isDisabled
      />
      <MultiSelect
        label={t(K.dietary)}
        items={items}
        removeLabel={remove}
        isRequired
        isInvalid
        errorMessage={t(K.invalid)}
      />
    </View>
  );
}

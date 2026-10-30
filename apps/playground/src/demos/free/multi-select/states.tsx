/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web MultiSelect: a menu item's dietary tags read-only, disabled and invalid.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); gap inventory row 4; ADR 0060
 *          (light, dark, RTL).
 */
import { MultiSelect as UiMultiSelect, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { MULTI_SELECT_KEYS } from "#src/demos/free/multi-select/multi-select-keys.constant";

/** The demo's keys. */
const K = MULTI_SELECT_KEYS.multi_select;

/** Multi-select: States. */
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
    <div className="grid max-w-md gap-4">
      <UiMultiSelect
        label={t(K.read_only)}
        items={items}
        removeLabel={remove}
        defaultValue={["halal", "spicy"]}
        isReadOnly
      />
      <UiMultiSelect
        label={t(K.disabled)}
        items={items}
        removeLabel={remove}
        defaultValue={["vegan"]}
        isDisabled
      />
      <UiMultiSelect
        label={t(K.dietary)}
        items={items}
        removeLabel={remove}
        isRequired
        isInvalid
        errorMessage={t(K.invalid)}
      />
    </div>
  );
}

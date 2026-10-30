/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web MultiSelect: the storefront collections of a product, filtered as you type.
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

/** Multi-select: Collections. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const items = [
    { id: "summer", label: t(K.summer) },
    { id: "ramadan", label: t(K.ramadan) },
    { id: "new", label: t(K.new) },
    { id: "best", label: t(K.best) },
    { id: "gifts", label: t(K.gifts) },
    { id: "eid", label: t(K.eid) },
  ];
  return (
    <div className="max-w-md">
      <UiMultiSelect
        label={t(K.collections)}
        description={t(K.collections_hint)}
        placeholder={t(K.placeholder)}
        emptyMessage={t(K.empty)}
        removeLabel={(label) => t(K.remove, { label })}
        items={items}
        defaultValue={["ramadan", "best"]}
      />
    </div>
  );
}

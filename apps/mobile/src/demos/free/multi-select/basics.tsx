/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native MultiSelect: the storefront collections of a product, picked from a searchable sheet.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); gap inventory row 4; ADR 0310
 *          (decision 6).
 */
import { MultiSelect, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { MULTI_SELECT_DEMO_KEYS } from "#src/demos/free/multi-select/multi-select-demo-keys.constant";

/** The demo's keys. */
const K = MULTI_SELECT_DEMO_KEYS.demo_free.multi_select.basics;

/** Collections as chips. */
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
    <MultiSelect
      label={t(K.collections)}
      description={t(K.collections_hint)}
      placeholder={t(K.placeholder)}
      emptyMessage={t(K.empty)}
      removeLabel={(label) => t(K.remove, { label })}
      items={items}
      defaultValue={["ramadan", "best"]}
    />
  );
}

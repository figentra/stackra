/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web MultiSelect: pick dietary tags and see the count; clear them from outside.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); gap inventory row 4; ADR 0060
 *          (light, dark, RTL).
 */
import { Button, MultiSelect as UiMultiSelect, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { MULTI_SELECT_KEYS } from "#src/demos/free/multi-select/multi-select-keys.constant";

/** The demo's keys. */
const K = MULTI_SELECT_KEYS.multi_select;

/** Multi-select: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [chosen, setChosen] = useState<readonly string[]>(["halal"]);
  const items = [
    { id: "halal", label: t(K.halal) },
    { id: "vegan", label: t(K.vegan) },
    { id: "gluten", label: t(K.gluten) },
    { id: "spicy", label: t(K.spicy) },
    { id: "nuts", label: t(K.nuts) },
  ];
  return (
    <div className="grid max-w-md gap-3">
      <UiMultiSelect
        label={t(K.dietary)}
        items={items}
        removeLabel={(label) => t(K.remove, { label })}
        value={chosen}
        onChange={setChosen}
      />
      <div className="flex items-center gap-3">
        <Text aria-live="polite">{t(K.chosen, { count: chosen.length })}</Text>
        <Button size="sm" variant="tertiary" onPress={() => setChosen([])}>
          {t(K.clear)}
        </Button>
      </div>
    </div>
  );
}

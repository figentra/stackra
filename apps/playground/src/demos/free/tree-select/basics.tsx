/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web TreeSelect: one product category picked from a tree of departments; the list closes on a choice.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave C, owner request 2026-10-29).
 */
import { TreeSelect, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TREE_SELECT_KEYS } from "#src/demos/free/tree-select/tree-select-keys.constant";

/** The demo's keys. */
const K = TREE_SELECT_KEYS.tree_select.basics;

/** TreeSelect: one category. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [category, setCategory] = useState<readonly string[]>(["abayas"]);
  return (
    <div className="w-full max-w-sm">
      <TreeSelect
        label={t(K.label)}
        description={t(K.description)}
        value={category}
        onChange={setCategory}
        defaultExpandedKeys={["women"]}
        items={[
          {
            id: "women",
            label: t(K.women),
            children: [
              { id: "abayas", label: t(K.abayas) },
              { id: "dresses", label: t(K.dresses) },
            ],
          },
          {
            id: "men",
            label: t(K.men),
            children: [
              { id: "thobes", label: t(K.thobes) },
              { id: "shemaghs", label: t(K.shemaghs) },
            ],
          },
          { id: "kids", label: t(K.kids) },
        ]}
      />
    </div>
  );
}

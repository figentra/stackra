/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native TreeSelect: one product category picked from a tree of departments in a sheet; the sheet closes on a choice.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave C, owner request 2026-10-29).
 */
import { TreeSelect, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { TREE_SELECT_DEMO_KEYS } from "#src/demos/free/tree-select/tree-select-demo-keys.constant";

/** The demo's keys. */
const K = TREE_SELECT_DEMO_KEYS.demo_free.tree_select.basics;

/** TreeSelect: one category. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [category, setCategory] = useState<readonly string[]>(["abayas"]);
  return (
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
  );
}

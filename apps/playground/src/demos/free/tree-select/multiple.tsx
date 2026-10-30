/**
 * Stackra file contract:
 * Purpose: the "multiple" demo of the web TreeSelect: the branches an offer runs in; ticking a region ticks its branches, and a region with some ticked shows a dash.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave C, owner request 2026-10-29).
 */
import { TreeSelect, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TREE_SELECT_KEYS } from "#src/demos/free/tree-select/tree-select-keys.constant";

/** The demo's keys. */
const K = TREE_SELECT_KEYS.tree_select.multiple;

/** TreeSelect: several branches. */
export default function Multiple() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="w-full max-w-sm">
      <TreeSelect
        label={t(K.label)}
        description={t(K.description)}
        selectionMode="multiple"
        defaultValue={["olaya", "online"]}
        defaultExpandedKeys={["central", "western"]}
        items={[
          {
            id: "central",
            label: t(K.central),
            children: [
              { id: "olaya", label: t(K.olaya) },
              { id: "malqa", label: t(K.malqa) },
            ],
          },
          {
            id: "western",
            label: t(K.western),
            children: [
              { id: "tahlia", label: t(K.tahlia) },
              { id: "aziziyah", label: t(K.aziziyah) },
            ],
          },
          { id: "online", label: t(K.online) },
        ]}
      />
    </div>
  );
}

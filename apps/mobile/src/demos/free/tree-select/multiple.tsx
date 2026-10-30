/**
 * Stackra file contract:
 * Purpose: the "multiple" demo of the native TreeSelect: the branches an offer runs in; ticking a region ticks its branches, and a region with some ticked shows a dash.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave C, owner request 2026-10-29).
 */
import { TreeSelect, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TREE_SELECT_DEMO_KEYS } from "#src/demos/free/tree-select/tree-select-demo-keys.constant";

/** The demo's keys. */
const K = TREE_SELECT_DEMO_KEYS.demo_free.tree_select.multiple;

/** TreeSelect: several branches. */
export default function Multiple() {
  const t = useCatalogueText(MESSAGES.en);
  return (
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
  );
}

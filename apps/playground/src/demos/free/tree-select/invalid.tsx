/**
 * Stackra file contract:
 * Purpose: the "invalid" demo of the web TreeSelect: a required department left empty, with its error under the field until one is chosen.
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
const K = TREE_SELECT_KEYS.tree_select.invalid;

/** TreeSelect: required and empty. */
export default function Invalid() {
  const t = useCatalogueText(MESSAGES.en);
  const [department, setDepartment] = useState<readonly string[]>([]);
  return (
    <div className="w-full max-w-sm">
      <TreeSelect
        label={t(K.label)}
        isRequired
        isInvalid={department.length === 0}
        errorMessage={t(K.error)}
        value={department}
        onChange={setDepartment}
        defaultExpandedKeys={["finance"]}
        items={[
          {
            id: "finance",
            label: t(K.finance),
            children: [
              { id: "payroll", label: t(K.payroll) },
              { id: "accounts", label: t(K.accounts) },
            ],
          },
          { id: "sales", label: t(K.sales) },
        ]}
      />
    </div>
  );
}

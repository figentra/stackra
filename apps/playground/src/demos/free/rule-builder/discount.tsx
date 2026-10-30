/**
 * Stackra file contract:
 * Purpose: the "discount" demo of the web RuleBuilder: when a discount applies.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import type { RuleGroup } from "@stackra/ui/contracts";
import { RuleBuilder, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { RULE_BUILDER_KEYS } from "#src/demos/free/rule-builder/rule-builder-keys.constant";

/** The demo's keys. */
const K = RULE_BUILDER_KEYS.rule_builder;

/** Rule builder: the conditions of a discount. */
export default function Discount() {
  const t = useCatalogueText(MESSAGES.en);
  const [rule, setRule] = useState<RuleGroup>({
    match: "all",
    conditions: [
      { id: "1", field: "total", operator: "greater", value: "150" },
      { id: "2", field: "city", operator: "equals", value: "riyadh" },
    ],
  });
  return (
    <RuleBuilder
      className="w-full max-w-2xl"
      label={t(K.label)}
      value={rule}
      onChange={setRule}
      fields={[
        { key: "total", label: t(K.total), type: "number" },
        {
          key: "city",
          label: t(K.city),
          type: "choice",
          options: (["riyadh", "jeddah", "dammam"] as const).map((id) => ({ id, label: t(K[id]) })),
        },
        { key: "tag", label: t(K.tag), type: "text" },
      ]}
    />
  );
}

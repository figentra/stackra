/**
 * Stackra file contract:
 * Purpose: the "variants" demo of the web Checkbox group: The primary variant sits on the page; the secondary variant
 *          is for a group on a surface.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL).
 */
import type { ChoiceOption } from "@stackra/ui/contracts";
import { CheckboxGroup as UiCheckboxGroup, Surface, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CHECKBOX_GROUP_KEYS } from "#src/demos/free/checkbox-group/checkbox-group-keys.constant";

/** The demo's keys. */
const K = CHECKBOX_GROUP_KEYS.checkbox_group;

/** Checkbox group: Variants. */
export default function Variants() {
  const t = useCatalogueText(MESSAGES.en);
  /** The options of the state samples. */
  const FORMATS: readonly ChoiceOption[] = [
    { value: "csv", label: t(K.sample.csv) },
    { value: "xlsx", label: t(K.sample.excel) },
    { value: "pdf", label: t(K.sample.pdf) },
  ];
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <UiCheckboxGroup
        label={t(K.group_labels.primary)}
        options={FORMATS}
        defaultValue={["xlsx"]}
        variant="primary"
      />
      <Surface variant="default" className="p-4">
        <UiCheckboxGroup
          label={t(K.group_labels.secondary)}
          options={FORMATS}
          defaultValue={["xlsx"]}
          variant="secondary"
        />
      </Surface>
    </div>
  );
}

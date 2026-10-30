/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web Checkbox group: One group per state, each with the caption of the state it
 *          shows.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL).
 */
import type { ChoiceOption } from "@stackra/ui/contracts";
import { CheckboxGroup as UiCheckboxGroup, Text, useCatalogueText } from "@stackra/ui/react";
import { useState, type ReactNode } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CHECKBOX_GROUP_KEYS } from "#src/demos/free/checkbox-group/checkbox-group-keys.constant";

/** The demo's keys. */
const K = CHECKBOX_GROUP_KEYS.checkbox_group;

/** The list that lays samples out in a responsive grid. */
const GRID = "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3";

/** A caption and the sample it describes, as one list item. */
function Sample({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <li className="grid content-start gap-2">
      <Text tone="muted" type="small">
        {caption}
      </Text>
      {children}
    </li>
  );
}

/** Checkbox group: States. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  /** The options of the state samples. */
  const FORMATS: readonly ChoiceOption[] = [
    { value: "csv", label: t(K.sample.csv) },
    { value: "xlsx", label: t(K.sample.excel) },
    { value: "pdf", label: t(K.sample.pdf) },
  ];
  /** The options with one of them disabled. */
  const FORMATS_WITH_ONE_DISABLED: readonly ChoiceOption[] = [
    { value: "csv", label: t(K.sample.csv) },
    { value: "xlsx", label: t(K.sample.excel) },
    { value: "pdf", label: t(K.sample.pdf), isDisabled: true },
  ];
  /** The days of the invalid sample. */
  const DAYS: readonly ChoiceOption[] = [
    { value: "mon", label: t(K.sample.monday) },
    { value: "thu", label: t(K.sample.thursday) },
  ];
  const [days, setDays] = useState<readonly string[]>([]);

  return (
    <ul className={GRID}>
      <Sample caption={t(K.captions.disabled)}>
        <UiCheckboxGroup
          label={t(K.group_labels.disabled)}
          options={FORMATS}
          defaultValue={["csv"]}
          isDisabled
        />
      </Sample>
      <Sample caption={t(K.captions.option_disabled)}>
        <UiCheckboxGroup
          label={t(K.group_labels.option_disabled)}
          options={FORMATS_WITH_ONE_DISABLED}
        />
      </Sample>
      <Sample caption={t(K.captions.read_only)}>
        <UiCheckboxGroup
          label={t(K.group_labels.read_only)}
          options={FORMATS}
          defaultValue={["csv", "pdf"]}
          isReadOnly
        />
      </Sample>
      <Sample caption={t(K.captions.required)}>
        <UiCheckboxGroup label={t(K.group_labels.required)} options={FORMATS} isRequired />
      </Sample>
      <Sample caption={t(K.captions.invalid)}>
        <UiCheckboxGroup
          label={t(K.group_labels.invalid)}
          description={t(K.invalid_description)}
          errorMessage={t(K.invalid_error)}
          options={DAYS}
          value={days}
          onChange={setDays}
          isInvalid={days.length === 0}
        />
      </Sample>
    </ul>
  );
}

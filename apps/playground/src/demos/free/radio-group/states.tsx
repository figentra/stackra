/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web Radio group: One group per state, each with the caption of the state it
 *          shows.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL).
 */
import type { ChoiceOption } from "@stackra/ui/contracts";
import { RadioGroup as UiRadioGroup, Text, useCatalogueText } from "@stackra/ui/react";
import { useState, type ReactNode } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { RADIO_GROUP_KEYS } from "#src/demos/free/radio-group/radio-group-keys.constant";

/** The demo's keys. */
const K = RADIO_GROUP_KEYS.radio_group;

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

/** Radio group: States. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  /** The options of the state samples. */
  const CYCLES: readonly ChoiceOption[] = [
    { value: "monthly", label: t(K.sample.monthly) },
    { value: "yearly", label: t(K.sample.yearly) },
  ];
  /** The options with one of them disabled. */
  const METHODS: readonly ChoiceOption[] = [
    { value: "card", label: t(K.sample.card) },
    { value: "transfer", label: t(K.sample.bank_transfer) },
    { value: "cheque", label: t(K.sample.cheque), isDisabled: true },
  ];
  const [hasPicked, setHasPicked] = useState(false);

  return (
    <ul className={GRID}>
      <Sample caption={t(K.captions.disabled)}>
        <UiRadioGroup
          label={t(K.group_labels.disabled)}
          options={CYCLES}
          defaultValue="monthly"
          isDisabled
        />
      </Sample>
      <Sample caption={t(K.captions.option_disabled)}>
        <UiRadioGroup label={t(K.group_labels.option_disabled)} options={METHODS} />
      </Sample>
      <Sample caption={t(K.captions.read_only)}>
        <UiRadioGroup
          label={t(K.group_labels.read_only)}
          options={CYCLES}
          defaultValue="yearly"
          isReadOnly
        />
      </Sample>
      <Sample caption={t(K.captions.required)}>
        <UiRadioGroup label={t(K.group_labels.required)} options={CYCLES} isRequired />
      </Sample>
      <Sample caption={t(K.captions.invalid)}>
        <UiRadioGroup
          label={t(K.group_labels.invalid)}
          description={t(K.invalid_description)}
          errorMessage={t(K.invalid_error)}
          options={CYCLES}
          onChange={() => setHasPicked(true)}
          isInvalid={!hasPicked}
        />
      </Sample>
    </ul>
  );
}

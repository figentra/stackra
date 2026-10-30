/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web Checkbox: One checkbox per state, each with the caption of the state it
 *          shows.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL).
 */
import { Checkbox as UiCheckbox, Text, useCatalogueText } from "@stackra/ui/react";
import { useState, type ReactNode } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CHECKBOX_KEYS } from "#src/demos/free/checkbox/checkbox-keys.constant";

/** The demo's keys. */
const K = CHECKBOX_KEYS.checkbox;

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

/** Checkbox: States. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  const [accepted, setAccepted] = useState(false);

  return (
    <ul className={GRID}>
      <Sample caption={t(K.captions.unchecked)}>
        <UiCheckbox label={t(K.labels.unchecked)} />
      </Sample>
      <Sample caption={t(K.captions.checked)}>
        <UiCheckbox label={t(K.labels.checked)} defaultValue />
      </Sample>
      <Sample caption={t(K.captions.indeterminate)}>
        <UiCheckbox label={t(K.labels.indeterminate)} isIndeterminate />
      </Sample>
      <Sample caption={t(K.captions.disabled)}>
        <UiCheckbox label={t(K.labels.disabled)} isDisabled />
      </Sample>
      <Sample caption={t(K.captions.disabled_checked)}>
        <UiCheckbox label={t(K.labels.disabled_checked)} isDisabled defaultValue />
      </Sample>
      <Sample caption={t(K.captions.read_only)}>
        <UiCheckbox label={t(K.labels.read_only)} isReadOnly defaultValue />
      </Sample>
      <Sample caption={t(K.captions.required)}>
        <UiCheckbox label={t(K.labels.required)} isRequired />
      </Sample>
      <Sample caption={t(K.captions.description)}>
        <UiCheckbox label={t(K.labels.description)} description={t(K.description_text)} />
      </Sample>
      <Sample caption={t(K.captions.invalid)}>
        <UiCheckbox
          label={t(K.labels.invalid)}
          isInvalid={!accepted}
          errorMessage={t(K.error_text)}
          value={accepted}
          onChange={setAccepted}
        />
      </Sample>
    </ul>
  );
}

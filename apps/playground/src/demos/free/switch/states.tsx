/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web Switch: One switch per state, each with the caption of the state it shows.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL).
 */
import { Switch as UiSwitch, Text, useCatalogueText } from "@stackra/ui/react";
import { useState, type ReactNode } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SWITCH_KEYS } from "#src/demos/free/switch/switch-keys.constant";

/** The demo's keys. */
const K = SWITCH_KEYS.switch;

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

/** Switch: States. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  const [allowed, setAllowed] = useState(false);

  return (
    <ul className={GRID}>
      <Sample caption={t(K.captions.off)}>
        <UiSwitch label={t(K.labels.off)} />
      </Sample>
      <Sample caption={t(K.captions.on)}>
        <UiSwitch label={t(K.labels.on)} defaultValue />
      </Sample>
      <Sample caption={t(K.captions.disabled)}>
        <UiSwitch label={t(K.labels.disabled)} isDisabled />
      </Sample>
      <Sample caption={t(K.captions.disabled_on)}>
        <UiSwitch label={t(K.labels.disabled_on)} isDisabled defaultValue />
      </Sample>
      <Sample caption={t(K.captions.read_only)}>
        <UiSwitch label={t(K.labels.read_only)} isReadOnly defaultValue />
      </Sample>
      <Sample caption={t(K.captions.required)}>
        <UiSwitch label={t(K.labels.required)} isRequired />
      </Sample>
      <Sample caption={t(K.captions.description)}>
        <UiSwitch label={t(K.labels.description)} description={t(K.description_text)} />
      </Sample>
      <Sample caption={t(K.captions.invalid)}>
        <UiSwitch
          label={t(K.labels.invalid)}
          isInvalid={!allowed}
          errorMessage={t(K.error_text)}
          value={allowed}
          onChange={setAllowed}
        />
      </Sample>
    </ul>
  );
}

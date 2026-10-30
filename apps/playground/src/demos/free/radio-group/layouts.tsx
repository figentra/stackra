/**
 * Stackra file contract:
 * Purpose: the "layouts" demo of the web Radio group: Vertical by default, with a description under an option;
 *          horizontal puts the options in a row.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL).
 */
import type { ChoiceOption } from "@stackra/ui/contracts";
import { RadioGroup as UiRadioGroup, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { RADIO_GROUP_KEYS } from "#src/demos/free/radio-group/radio-group-keys.constant";

/** The demo's keys. */
const K = RADIO_GROUP_KEYS.radio_group;

/** Radio group: Layouts. */
export default function Layouts() {
  const t = useCatalogueText(MESSAGES.en);
  /** The options of the vertical group; the first carries a description. */
  const SPEEDS: readonly ChoiceOption[] = [
    {
      value: "standard",
      label: t(K.sample.standard),
      description: t(K.sample.delivered_in_5_to_7),
    },
    { value: "express", label: t(K.sample.express), description: t(K.sample.delivered_in_2_to_3) },
    { value: "overnight", label: t(K.sample.overnight) },
  ];
  /** The options of the horizontal group. */
  const SIZES: readonly ChoiceOption[] = [
    { value: "s", label: t(K.sample.small) },
    { value: "m", label: t(K.sample.medium) },
    { value: "l", label: t(K.sample.large) },
  ];
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <UiRadioGroup
        label={t(K.group_labels.vertical)}
        description={t(K.vertical_description)}
        options={SPEEDS}
        defaultValue="standard"
      />
      <UiRadioGroup
        label={t(K.group_labels.horizontal)}
        options={SIZES}
        orientation="horizontal"
        defaultValue="m"
      />
    </div>
  );
}

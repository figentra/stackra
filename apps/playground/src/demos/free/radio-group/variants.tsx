/**
 * Stackra file contract:
 * Purpose: the "variants" demo of the web Radio group: The primary variant sits on the page; the secondary variant is
 *          for a group on a surface.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL).
 */
import type { ChoiceOption } from "@stackra/ui/contracts";
import { RadioGroup as UiRadioGroup, Surface, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { RADIO_GROUP_KEYS } from "#src/demos/free/radio-group/radio-group-keys.constant";

/** The demo's keys. */
const K = RADIO_GROUP_KEYS.radio_group;

/** Radio group: Variants. */
export default function Variants() {
  const t = useCatalogueText(MESSAGES.en);
  /** The options of the horizontal group. */
  const SIZES: readonly ChoiceOption[] = [
    { value: "s", label: t(K.sample.small) },
    { value: "m", label: t(K.sample.medium) },
    { value: "l", label: t(K.sample.large) },
  ];
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <UiRadioGroup
        label={t(K.group_labels.primary)}
        options={SIZES}
        defaultValue="s"
        variant="primary"
      />
      <Surface variant="default" className="p-4">
        <UiRadioGroup
          label={t(K.group_labels.secondary)}
          options={SIZES}
          defaultValue="s"
          variant="secondary"
        />
      </Surface>
    </div>
  );
}

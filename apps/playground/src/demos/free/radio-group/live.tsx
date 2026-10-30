/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Radio group: The readout shows the chosen key; the buttons choose from outside
 *          the group.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL).
 */
import type { ChoiceOption } from "@stackra/ui/contracts";
import { Button, RadioGroup as UiRadioGroup, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { RADIO_GROUP_KEYS } from "#src/demos/free/radio-group/radio-group-keys.constant";

/** The demo's keys. */
const K = RADIO_GROUP_KEYS.radio_group;

/** Radio group: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  /** The options of the live example. */
  const FRUIT: readonly ChoiceOption[] = [
    { value: "apple", label: t(K.sample.apple) },
    { value: "pear", label: t(K.sample.pear) },
    { value: "plum", label: t(K.sample.plum) },
  ];
  const [fruit, setFruit] = useState("apple");

  return (
    <div className="grid gap-3">
      <UiRadioGroup
        label={t(K.group_labels.live)}
        options={FRUIT}
        value={fruit}
        onChange={setFruit}
      />
      <Text role="status">{t(K.chosen, { key: fruit })}</Text>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onPress={() => setFruit("apple")}>
          {t(K.pick_apple)}
        </Button>
        <Button variant="secondary" onPress={() => setFruit("pear")}>
          {t(K.pick_pear)}
        </Button>
      </div>
    </div>
  );
}

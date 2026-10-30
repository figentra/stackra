/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Checkbox group: The readout lists the keys of the checked options, in the order
 *          they were checked.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL).
 */
import type { ChoiceOption } from "@stackra/ui/contracts";
import {
  Button,
  CheckboxGroup as UiCheckboxGroup,
  Text,
  useCatalogueText,
} from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CHECKBOX_GROUP_KEYS } from "#src/demos/free/checkbox-group/checkbox-group-keys.constant";

/** The demo's keys. */
const K = CHECKBOX_GROUP_KEYS.checkbox_group;

/** Checkbox group: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  /** The options of the live example. */
  const TOPPINGS: readonly ChoiceOption[] = [
    { value: "cheese", label: t(K.sample.cheese) },
    { value: "olives", label: t(K.sample.olives) },
    { value: "basil", label: t(K.sample.basil) },
    { value: "chilli", label: t(K.sample.chilli) },
  ];
  const [toppings, setToppings] = useState<readonly string[]>(["cheese"]);

  return (
    <div className="grid gap-3">
      <UiCheckboxGroup
        label={t(K.group_labels.live)}
        options={TOPPINGS}
        value={toppings}
        onChange={setToppings}
      />
      <Text role="status">{t(K.chosen, { keys: toppings.join(", ") || t(K.none) })}</Text>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onPress={() => setToppings(TOPPINGS.map(({ value }) => value))}>
          {t(K.all)}
        </Button>
        <Button variant="secondary" onPress={() => setToppings([])}>
          {t(K.clear)}
        </Button>
      </div>
    </div>
  );
}

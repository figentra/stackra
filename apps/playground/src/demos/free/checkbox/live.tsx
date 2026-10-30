/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Checkbox: The parent shows a dash while some children are checked, checks all
 *          of them when pressed, and clears them when all are checked.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL).
 */
import { Button, Checkbox as UiCheckbox, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CHECKBOX_KEYS } from "#src/demos/free/checkbox/checkbox-keys.constant";

/** The demo's keys. */
const K = CHECKBOX_KEYS.checkbox;

/** Checkbox: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  /** The three children of the live example. */
  const TOPPINGS = [
    { key: "cheese", label: t(K.sample.cheese) },
    { key: "olives", label: t(K.sample.olives) },
    { key: "basil", label: t(K.sample.basil) },
  ] as const;
  const [topping, setTopping] = useState<readonly string[]>(["cheese"]);

  const all = topping.length === TOPPINGS.length;

  const names = TOPPINGS.filter(({ key }) => topping.includes(key))
    .map(({ label }) => label)
    .join(", ");

  return (
    <div className="grid gap-3">
      <UiCheckbox
        label={t(K.parent)}
        value={all}
        isIndeterminate={topping.length > 0 && !all}
        onChange={(isChecked) => setTopping(isChecked ? TOPPINGS.map(({ key }) => key) : [])}
      />
      <ul aria-label={t(K.children)} className="grid gap-3 ps-8">
        {TOPPINGS.map(({ key, label }) => (
          <li key={key}>
            <UiCheckbox
              label={label}
              value={topping.includes(key)}
              onChange={(isChecked) =>
                setTopping((current) =>
                  isChecked ? [...current, key] : current.filter((item) => item !== key),
                )
              }
            />
          </li>
        ))}
      </ul>
      <Text role="status">{t(K.chosen, { names: names || t(K.none) })}</Text>
      <div>
        <Button variant="secondary" onPress={() => setTopping([])}>
          {t(K.clear)}
        </Button>
      </div>
    </div>
  );
}

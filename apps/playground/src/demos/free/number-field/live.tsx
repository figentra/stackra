/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Number field: A field of one to ten seats. The text below it shows the number
 *          the field holds, or that it is empty.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0318 (decision 9); ADR 0060 (light, dark, RTL).
 */
import { NumberField as UiNumberField, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { NUMBER_FIELD_KEYS } from "#src/demos/free/number-field/number-field-keys.constant";

/** The demo's keys. */
const K = NUMBER_FIELD_KEYS.number_field;

/** Number field: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [seats, setSeats] = useState<number | null>(4);

  return (
    <div className="grid gap-6">
      <UiNumberField
        label={t(K.live_label)}
        description={t(K.live_description)}
        value={seats}
        onChange={setSeats}
        minValue={1}
        maxValue={10}
      />
      <Text data-testid="number-field-value" aria-live="polite">
        {seats === null ? t(K.live_empty) : t(K.live_chosen, { seats })}
      </Text>
    </div>
  );
}

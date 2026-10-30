/**
 * Stackra file contract:
 * Purpose: the "bounded" demo of the native DateField: `minValue` and `maxValue` bound the calendar.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { getLocalTimeZone, today } from "@internationalized/date";
import { DateField, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DATE_FIELD_DEMO_KEYS } from "#src/demos/free/date-field/date-field-demo-keys.constant";

/** The demo's keys. */
const K = DATE_FIELD_DEMO_KEYS.demo_free.date_field.bounded;

/** From today to two months ahead. */
export default function Bounded() {
  const t = useCatalogueText(MESSAGES.en);
  const now = today(getLocalTimeZone());
  return (
    <DateField
      label={t(K.label)}
      description={t(K.hint)}
      minValue={now}
      maxValue={now.add({ months: 2 })}
      defaultValue={now.add({ weeks: 1 })}
    />
  );
}

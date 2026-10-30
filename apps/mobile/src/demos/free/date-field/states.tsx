/**
 * Stackra file contract:
 * Purpose: the "states" demo of the native DateField: required, invalid, disabled and read-only.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { getLocalTimeZone, today } from "@internationalized/date";
import { DateField, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DATE_FIELD_DEMO_KEYS } from "#src/demos/free/date-field/date-field-demo-keys.constant";

/** The demo's keys. */
const K = DATE_FIELD_DEMO_KEYS.demo_free.date_field.states;

/** Disabled and read-only keep their day and never open the calendar. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  const now = today(getLocalTimeZone());
  return (
    <View className="gap-4">
      <DateField label={t(K.required)} isRequired />
      <DateField
        label={t(K.invalid)}
        isInvalid
        errorMessage={t(K.invalid_error)}
        defaultValue={now.subtract({ days: 3 })}
      />
      <DateField label={t(K.disabled)} isDisabled defaultValue={now.add({ weeks: 1 })} />
      <DateField label={t(K.read_only)} isReadOnly defaultValue={now.add({ weeks: 1 })} />
    </View>
  );
}

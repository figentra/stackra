/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native DateField: an empty field says so; a filled one writes its day in the locale.
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
const K = DATE_FIELD_DEMO_KEYS.demo_free.date_field.basics;

/** Empty, then filled with a day next week. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      <DateField label={t(K.empty)} description={t(K.empty_hint)} />
      <DateField label={t(K.filled)} defaultValue={today(getLocalTimeZone()).add({ weeks: 1 })} />
    </View>
  );
}

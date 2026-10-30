/**
 * Stackra file contract:
 * Purpose: the "hijri" demo of the native Date picker: Hijri calendar.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); wave 3a forms and pickers
 *          (owner approval 2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { CalendarDate } from "@internationalized/date";
import { DatePicker, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DATE_PICKER_HIJRI_DEMO_KEYS } from "#src/demos/free/date-picker/date-picker-hijri-demo-keys.constant";

/** The demo's keys. */
const K = DATE_PICKER_HIJRI_DEMO_KEYS.demo_free.date_picker.hijri;

/** Date picker: Hijri calendar. */
export default function Hijri() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      <DatePicker
        label={t(K.label)}
        description={t(K.hint)}
        calendarButtonLabel={t(K.button)}
        calendar="islamic-umalqura"
        defaultValue={new CalendarDate(2026, 3, 18)}
      />
    </View>
  );
}

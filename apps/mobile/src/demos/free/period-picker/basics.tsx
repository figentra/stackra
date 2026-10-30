/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native PeriodPicker: the preset periods and "Custom range", no comparison.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { CalendarDate } from "@internationalized/date";
import { PeriodPicker, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { PERIOD_PICKER_DEMO_KEYS } from "#src/demos/free/period-picker/period-picker-demo-keys.constant";

/** The demo's keys. */
const K = PERIOD_PICKER_DEMO_KEYS.demo_free.period_picker;

/** Period picker: basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      <PeriodPicker
        label={t(K.label)}
        today={new CalendarDate(2026, 10, 29)}
        showComparison={false}
      />
    </View>
  );
}

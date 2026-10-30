/**
 * Stackra file contract:
 * Purpose: the "hijri" demo of the native Year picker: Hijri years.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); wave 3a forms and pickers
 *          (owner approval 2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { YearPicker, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { YEAR_PICKER_DEMO_KEYS } from "#src/demos/free/year-picker/year-picker-demo-keys.constant";

/** The demo's keys. */
const K = YEAR_PICKER_DEMO_KEYS.demo_free.year_picker.hijri;

/** Year picker: Hijri years. */
export default function Hijri() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      <YearPicker
        label={t(K.label)}
        calendar="islamic-umalqura"
        minYear={2023}
        maxYear={2028}
        defaultValue={2026}
      />
    </View>
  );
}

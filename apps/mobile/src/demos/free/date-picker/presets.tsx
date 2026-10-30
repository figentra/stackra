/**
 * Stackra file contract:
 * Purpose: the "presets" demo of the native DatePicker: quick dates (Today, Tomorrow, In 7 days…) under the field.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { DatePreset } from "@stackra/ui/contracts";
import { DatePicker, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DATE_PICKER_PRESETS_DEMO_KEYS } from "#src/demos/free/date-picker/date-picker-presets-demo-keys.constant";

/** The demo's keys. */
const K = DATE_PICKER_PRESETS_DEMO_KEYS.demo_free.date_picker_presets;

/** Date picker: quick dates under the field. */
export default function Presets() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View>
      <DatePicker label={t(K.label)} description={t(K.hint)} presets={DatePreset} />
    </View>
  );
}

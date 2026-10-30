/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Range slider: Basics.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); wave 3a forms and pickers
 *          (owner approval 2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { RangeSlider, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { RANGE_SLIDER_DEMO_KEYS } from "#src/demos/free/range-slider/range-slider-demo-keys.constant";

/** The demo's keys. */
const K = RANGE_SLIDER_DEMO_KEYS.demo_free.range_slider.basics;

/** Range slider: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      <RangeSlider
        label={t(K.label)}
        description={t(K.hint)}
        minValue={0}
        maxValue={1000}
        step={10}
        defaultValue={[150, 600]}
        formatOptions={{ style: "currency", currency: "SAR", maximumFractionDigits: 0 }}
      />
    </View>
  );
}

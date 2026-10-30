/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Slider: a discount from 0 to 50 percent, with marks at the common steps.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Slider, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SLIDER_DEMO_KEYS } from "#src/demos/free/slider/slider-demo-keys.constant";

/** The demo's keys. */
const K = SLIDER_DEMO_KEYS.demo_free.slider.basics;

/** Slider: a discount from 0 to 50 percent, with marks at the common steps. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      <Slider
        label={t(K.label)}
        description={t(K.hint)}
        maxValue={50}
        defaultValue={15}
        formatOptions={{ style: "unit", unit: "percent" }}
        marks={[{ value: 0 }, { value: 10 }, { value: 25 }, { value: 50 }]}
      />
    </View>
  );
}

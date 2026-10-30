/**
 * Stackra file contract:
 * Purpose: the "rotation" demo of the native AngleSlider: a product photo's rotation in steps of 15 degrees, applied to
 *          a preview card.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { AngleSlider, Icon, Surface, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { ANGLE_SLIDER_DEMO_KEYS } from "#src/demos/free/angle-slider/angle-slider-demo-keys.constant";

/** The demo's keys. */
const K = ANGLE_SLIDER_DEMO_KEYS.demo_free.angle_slider.rotation;

/** AngleSlider: a rotation. */
export default function Rotation() {
  const t = useCatalogueText(MESSAGES.en);
  const [angle, setAngle] = useState(0);
  return (
    <View className="flex-row flex-wrap items-center gap-6">
      <AngleSlider label={t(K.label)} step={15} size={128} value={angle} onChange={setAngle} />
      <Surface className="size-28 items-center justify-center">
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={t(K.preview)}
          style={{ transform: [{ rotate: `${angle}deg` }] }}
        >
          <Icon name="image" size="lg" />
        </View>
      </Surface>
    </View>
  );
}

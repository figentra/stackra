/**
 * Stackra file contract:
 * Purpose: the "rotation" demo of the web AngleSlider: a product photo's rotation in steps of 15 degrees, applied to
 *          a preview card.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { AngleSlider, Icon, Surface, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { ANGLE_SLIDER_KEYS } from "#src/demos/free/angle-slider/angle-slider-keys.constant";

/** The demo's keys. */
const K = ANGLE_SLIDER_KEYS.angle_slider.rotation;

/** AngleSlider: a rotation. */
export default function Rotation() {
  const t = useCatalogueText(MESSAGES.en);
  const [angle, setAngle] = useState(0);
  return (
    <div className="flex flex-wrap items-center gap-6">
      <AngleSlider label={t(K.label)} step={15} size={128} value={angle} onChange={setAngle} />
      <Surface className="grid size-32 place-items-center">
        <span role="img" aria-label={t(K.preview)} style={{ transform: `rotate(${angle}deg)` }}>
          <Icon name="image" size="lg" />
        </span>
      </Surface>
    </div>
  );
}

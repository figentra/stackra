/**
 * Stackra file contract:
 * Purpose: the "gradient" demo of the web AngleSlider: a banner gradient's direction, previewed beside the dial.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { AngleSlider, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { ANGLE_SLIDER_KEYS } from "#src/demos/free/angle-slider/angle-slider-keys.constant";

/** The demo's keys. */
const K = ANGLE_SLIDER_KEYS.angle_slider.gradient;

/** AngleSlider: a gradient's angle. */
export default function Gradient() {
  const t = useCatalogueText(MESSAGES.en);
  const [angle, setAngle] = useState(135);
  return (
    <div className="flex flex-wrap items-center gap-6">
      <AngleSlider label={t(K.label)} value={angle} onChange={setAngle} hasMarks />
      <div
        aria-label={t(K.preview)}
        role="img"
        className="h-32 w-56 border border-border"
        style={{
          borderRadius: "var(--radius-container)",
          backgroundImage: `linear-gradient(${angle}deg, var(--accent), var(--success))`,
        }}
      />
    </div>
  );
}

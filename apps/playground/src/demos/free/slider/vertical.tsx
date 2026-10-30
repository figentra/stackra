/**
 * Stackra file contract:
 * Purpose: the "vertical" demo of the web Slider: a showroom's cooling set point, from 16 to 30 degrees.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Slider, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SLIDER_KEYS } from "#src/demos/free/slider/slider-keys.constant";

/** The demo's keys. */
const K = SLIDER_KEYS.slider.vertical;

/** Slider: a showroom's cooling set point, from 16 to 30 degrees. */
export default function Vertical() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Slider
      label={t(K.label)}
      orientation="vertical"
      minValue={16}
      maxValue={30}
      defaultValue={22}
      formatOptions={{ style: "unit", unit: "celsius" }}
      marks={[{ value: 16, label: t(K.cool) }, { value: 23 }, { value: 30, label: t(K.warm) }]}
    />
  );
}

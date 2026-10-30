/**
 * Stackra file contract:
 * Purpose: the "input" demo of the web Slider: a monthly ad budget in riyals, dragged or typed exactly.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Slider, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SLIDER_KEYS } from "#src/demos/free/slider/slider-keys.constant";

/** The demo's keys. */
const K = SLIDER_KEYS.slider.input;

/** Slider: a monthly ad budget in riyals, dragged or typed exactly. */
export default function Input() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Slider
      className="w-full max-w-lg"
      label={t(K.label)}
      description={t(K.hint)}
      maxValue={20_000}
      step={500}
      defaultValue={7500}
      hasInput
      formatOptions={{ style: "currency", currency: "SAR", maximumFractionDigits: 0 }}
    />
  );
}

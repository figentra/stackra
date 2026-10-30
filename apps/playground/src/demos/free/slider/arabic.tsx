/**
 * Stackra file contract:
 * Purpose: the "arabic" demo of the web Slider: in Arabic the track fills from the right and the marks follow.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Slider, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SLIDER_KEYS } from "#src/demos/free/slider/slider-keys.constant";

/** The demo's keys. */
const K = SLIDER_KEYS.slider.arabic;

/** Slider: in Arabic the track fills from the right and the marks follow. */
export default function Arabic() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div dir="rtl" lang="ar" className="w-full max-w-md">
      <Slider
        label={t(K.label)}
        description={t(K.hint)}
        maxValue={50}
        defaultValue={20}
        formatOptions={{ style: "unit", unit: "percent" }}
        marks={[{ value: 0 }, { value: 10 }, { value: 25 }, { value: 50 }]}
      />
    </div>
  );
}

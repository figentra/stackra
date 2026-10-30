/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Colour picker: Basics.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); wave 3a forms and pickers
 *          (owner approval 2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { ColorPicker, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { COLOR_PICKER_KEYS } from "#src/demos/free/color-picker/color-picker-keys.constant";

/** The demo's keys. */
const K = COLOR_PICKER_KEYS.color_picker.basics;

/** Colour picker: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-4">
      <ColorPicker label={t(K.label)} description={t(K.hint)} defaultValue="#4f46e5" />
    </div>
  );
}

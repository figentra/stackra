/**
 * Stackra file contract:
 * Purpose: the "speed" demo of the web Spinner: Slower, set by the caller with a class on web; it still stops under
 *          reduced motion.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { Spinner as UiSpinner, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SPINNER_KEYS } from "#src/demos/free/spinner/spinner-keys.constant";

/** The demo's keys. */
const K = SPINNER_KEYS.spinner;

/** Spinner: Speed. */
export default function Speed() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="flex items-center gap-2">
      {/* Decorative: the text beside it names the wait. */}
      <UiSpinner className="animate-[spin_1.5s_linear_infinite] motion-reduce:animate-none" />
      <Text tone="muted">{t(K.slow)}</Text>
    </div>
  );
}

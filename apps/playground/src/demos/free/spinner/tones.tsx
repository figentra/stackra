/**
 * Stackra file contract:
 * Purpose: the "tones" demo of the web Spinner: One spinner per tone; each is drawn 3:1 or more against the page.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { TextTone } from "@stackra/ui/contracts";
import { Spinner as UiSpinner, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SPINNER_KEYS } from "#src/demos/free/spinner/spinner-keys.constant";

/** The demo's keys. */
const K = SPINNER_KEYS.spinner;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-6";

/** Spinner: Tones. */
export default function Tones() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className={ROW}>
      {TextTone.map((tone) => (
        <UiSpinner key={tone} tone={tone} label={t(K.tone_label, { tone })} data-tone={tone} />
      ))}
    </div>
  );
}

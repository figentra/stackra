/**
 * Stackra file contract:
 * Purpose: the "sizes" demo of the web Spinner: Small, medium and large: 16, 24 and 32 pixels on web and native.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { Size } from "@stackra/ui/contracts";
import { Spinner as UiSpinner, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SPINNER_KEYS } from "#src/demos/free/spinner/spinner-keys.constant";

/** The demo's keys. */
const K = SPINNER_KEYS.spinner;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-6";

/** Spinner: Sizes. */
export default function Sizes() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className={ROW}>
      {Size.map((size) => (
        <UiSpinner key={size} size={size} label={t(K.size_label, { size })} data-size={size} />
      ))}
    </div>
  );
}

/**
 * Stackra file contract:
 * Purpose: the "tooltip" demo of the web Truncate: a product name cut to one line, whole in a tooltip; a short one has none.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Truncate, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TRUNCATE_KEYS } from "#src/demos/free/truncate/truncate-keys.constant";

/** The demo's keys. */
const K = TRUNCATE_KEYS.truncate.tooltip;

/** Truncate: a product name cut to one line, whole in a tooltip; a short one has none. */
export default function Tooltip() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid w-64 gap-2">
      <Truncate lines={1} mode="tooltip">
        {t(K.long)}
      </Truncate>
      <Truncate lines={1} mode="tooltip">
        {t(K.short)}
      </Truncate>
    </div>
  );
}

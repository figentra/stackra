/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web Disclosure: a section that starts open and one that is refused.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave C).
 */
import { Disclosure, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { DISCLOSURE_KEYS } from "#src/demos/free/disclosure/disclosure-keys.constant";

/** The demo's keys. */
const K = DISCLOSURE_KEYS.disclosure.states;

/** Disclosure: open at first, and disabled. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid w-full max-w-md gap-2">
      <Disclosure title={t(K.advanced)} defaultExpanded>
        <p className="m-0 text-sm text-muted">{t(K.advanced_body)}</p>
      </Disclosure>
      <Disclosure title={t(K.locked)} isDisabled>
        <p className="m-0 text-sm text-muted">{t(K.locked_body)}</p>
      </Disclosure>
    </div>
  );
}

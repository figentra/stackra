/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Disclosure: delivery details under a product, shown on demand.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave C).
 */
import { Disclosure, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { DISCLOSURE_KEYS } from "#src/demos/free/disclosure/disclosure-keys.constant";

/** The demo's keys. */
const K = DISCLOSURE_KEYS.disclosure.basics;

/** Disclosure: one section, closed at first. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="w-full max-w-md">
      <Disclosure title={t(K.title)}>
        <p className="m-0 text-sm text-muted">{t(K.body)}</p>
      </Disclosure>
    </div>
  );
}

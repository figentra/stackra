/**
 * Stackra file contract:
 * Purpose: the "core-pill" demo of the web ButtonLink: the landing's call to action, a large `core` link in the `pill`
 *          shape, beside a quieter secondary pill.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown. Both links point
 *           back at this demo, so following one stays on the page.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL); STA-2041 (the landing's core pill).
 */
import { ButtonLink, useCatalogueText } from "@stackra/ui/react";
import { useLocation } from "react-router";

import { MESSAGES } from "#src/constants/messages.constant";
import { BUTTON_LINK_KEYS } from "#src/demos/free/button-link/button-link-keys.constant";

/** The demo's keys. */
const K = BUTTON_LINK_KEYS.button_link.core_pill;

/** ButtonLink: Core pill. */
export default function CorePill() {
  const t = useCatalogueText(MESSAGES.en);
  const { pathname, search } = useLocation();
  // A same-page anchor that keeps the scheme and language, which a bare `#id` would drop.
  const here = `${pathname}${search}#button-link-core-pill`;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <ButtonLink href={here} variant="core" shape="pill" size="lg">
        {t(K.docs)}
      </ButtonLink>
      <ButtonLink href={here} variant="secondary" shape="pill" size="lg">
        {t(K.changelog)}
      </ButtonLink>
    </div>
  );
}

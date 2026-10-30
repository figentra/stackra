/**
 * Stackra file contract:
 * Purpose: the "router" demo of the web Link: An app path is a client navigation through the shell’s RouterProvider:
 *          the page does not reload and the scheme and language stay.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decisions 5 and 7); ADR 0060 (right-to-left).
 */
import { Link as UiLink, useCatalogueText } from "@stackra/ui/react";
import { useLocation } from "react-router";
import { MESSAGES } from "#src/constants/messages.constant";
import { LINK_KEYS } from "#src/demos/free/link/link-keys.constant";

/** The demo's keys. */
const K = LINK_KEYS.link;

/** The Link demo: router. */
export default function Router() {
  const t = useCatalogueText(MESSAGES.en);
  const { search } = useLocation();

  return (
    <div>
      <UiLink href={`/foundations${search}`} underline="hover">
        {t(K.router_link)}
      </UiLink>
    </div>
  );
}

/**
 * Stackra file contract:
 * Purpose: the "long" demo of the web Link: An Arabic sentence with a link that wraps across lines.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decisions 5 and 7); ADR 0060 (right-to-left).
 */
import { Link as UiLink, Text, useCatalogueText } from "@stackra/ui/react";
import { useLocation } from "react-router";
import { MESSAGES } from "#src/constants/messages.constant";
import { LINK_KEYS } from "#src/demos/free/link/link-keys.constant";

/** The demo's keys. */
const K = LINK_KEYS.link;

/** Link: Long text. */
export default function Long() {
  const t = useCatalogueText(MESSAGES.en);
  const { pathname, search } = useLocation();

  // A same-page anchor that keeps the scheme and language, which a bare `#id` would drop.
  const here = `${pathname}${search}`;

  return (
    <Text lang="ar" className="max-w-xs">
      {t(K.arabic)} <UiLink href={`${here}#link-long`}>{t(K.arabic_link_text)}</UiLink>
      {t(K.arabic_sentence_end)}
    </Text>
  );
}

/**
 * Stackra file contract:
 * Purpose: the "running" demo of the web Link: A link in a paragraph is always underlined: the theme’s link colour
 *          equals the text colour, so colour alone would not tell it apart.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decisions 5 and 7); ADR 0060 (right-to-left).
 */
import { Enum, Tone } from "@stackra/contracts";
import { Link as UiLink, Text, useCatalogueText } from "@stackra/ui/react";
import { useLocation } from "react-router";
import { MESSAGES } from "#src/constants/messages.constant";
import { LINK_KEYS } from "#src/demos/free/link/link-keys.constant";

/** The demo's keys. */
const K = LINK_KEYS.link;

/** Link: In running text. */
export default function Running() {
  const t = useCatalogueText(MESSAGES.en);
  const { pathname, search } = useLocation();

  // A same-page anchor that keeps the scheme and language, which a bare `#id` would drop.
  const here = `${pathname}${search}`;

  return (
    <div className="grid gap-6">
      {/* Only `always` links in a paragraph: a hover-only one would fail WCAG 1.4.1 and axe's link-in-text-block. */}
      <Text className="max-w-prose">
        <bdi>{t(K.before_links)}</bdi>
        {Enum.values(Tone).map((tone, index) => (
          <span key={tone}>
            <UiLink href={`${here}#link-running`} tone={tone}>
              {tone}
            </UiLink>
            {index < Enum.values(Tone).length - 1 ? ", " : ""}
          </span>
        ))}
        <bdi>{t(K.after_links)}</bdi>
      </Text>
    </div>
  );
}

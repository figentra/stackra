/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web Link: Disabled, press only (no href) and icon only, each with its own name.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decisions 5 and 7); ADR 0060 (right-to-left).
 */
import { Icon, Link as UiLink, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { useLocation } from "react-router";
import { MESSAGES } from "#src/constants/messages.constant";
import { LINK_KEYS } from "#src/demos/free/link/link-keys.constant";

/** The demo's keys. */
const K = LINK_KEYS.link;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-x-6 gap-y-2";

/** The Link demo: states. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  const { pathname, search } = useLocation();

  const [presses, setPresses] = useState(0);

  // A same-page anchor that keeps the scheme and language, which a bare `#id` would drop.
  const here = `${pathname}${search}`;

  return (
    <ul className={ROW}>
      <li>
        <UiLink href={`${here}#link-states`} isDisabled>
          {t(K.disabled_link)}
        </UiLink>
      </li>
      <li>
        <UiLink onPress={() => setPresses((count) => count + 1)}>{t(K.press_link)}</UiLink>
      </li>
      <li>
        <UiLink href={`${here}#link-states`} label={t(K.settings_label)}>
          <Icon name="settings" />
        </UiLink>
      </li>
      <li>
        <output aria-live="polite" data-testid="press-count">
          <bdi>{t(K.press_count, { count: presses })}</bdi>
        </output>
      </li>
    </ul>
  );
}

/**
 * Stackra file contract:
 * Purpose: the "external" demo of the web Link: An external link opens a new tab, shows the external mark at the
 *          inline end and says so to screen readers.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decisions 5 and 7); ADR 0060 (right-to-left).
 */
import { Icon, Link as UiLink, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { LINK_KEYS } from "#src/demos/free/link/link-keys.constant";

/** The demo's keys. */
const K = LINK_KEYS.link;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-x-6 gap-y-2";

/** The Link demo: external. */
export default function External() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ul className={ROW}>
      <li>
        <UiLink href="https://heroui.com" isExternal>
          {t(K.external_text)}
        </UiLink>
      </li>
      <li>
        <UiLink href="https://heroui.com" isExternal label={t(K.external_label)}>
          <Icon name="settings" />
        </UiLink>
      </li>
    </ul>
  );
}

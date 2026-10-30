/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web Icon button: Disabled, and loading: the icon gives way to a spinner and the
 *          size stays.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decisions 3 and 7); WCAG 2.2 SC 4.1.2 and 2.5.8.
 */
import { IconButton as UiIconButton, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { ICON_BUTTON_KEYS } from "#src/demos/free/icon-button/icon-button-keys.constant";

/** The demo's keys. */
const K = ICON_BUTTON_KEYS.icon_button;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-4";

/** Icon button: States. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ul className={ROW}>
      <li>
        <UiIconButton isDisabled label={t(K.disabled)} icon="settings" />
      </li>
      <li>
        <UiIconButton isLoading label={t(K.loading)} icon="settings" />
      </li>
    </ul>
  );
}

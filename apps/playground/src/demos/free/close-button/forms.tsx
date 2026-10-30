/**
 * Stackra file contract:
 * Purpose: the "forms" demo of the web Close button: The default mark, an icon of your own, and the disabled state.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decisions 3 and 7); WCAG 2.2 SC 4.1.2 and 2.5.8.
 */
import { CloseButton as UiCloseButton, Icon, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CLOSE_BUTTON_KEYS } from "#src/demos/free/close-button/close-button-keys.constant";

/** The demo's keys. */
const K = CLOSE_BUTTON_KEYS.close_button;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-4";

/** Close button: Forms. */
export default function Forms() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ul className={ROW}>
      <li>
        <UiCloseButton label={t(K.default)} />
      </li>
      <li>
        <UiCloseButton label={t(K.custom)} icon={<Icon name="circle-x" size="sm" />} />
      </li>
      <li>
        <UiCloseButton label={t(K.disabled)} isDisabled />
      </li>
    </ul>
  );
}

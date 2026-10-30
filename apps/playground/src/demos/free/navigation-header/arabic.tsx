/**
 * Stackra file contract:
 * Purpose: the "arabic" demo of the web Navigation header: A right-to-left header: the back button is at the right
 *          and its chevron points the other way, and the whole row mirrors with no side written in the component.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0317 (decisions 4, 5 and 7); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1,
 *          2.4.6, 2.5.8 and 4.1.3.
 */
import {
  IconButton,
  NavigationHeader as UiNavigationHeader,
  useCatalogueText,
} from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { NAVIGATION_HEADER_KEYS } from "#src/demos/free/navigation-header/navigation-header-keys.constant";

/** The demo's keys. */
const K = NAVIGATION_HEADER_KEYS.navigation_header;

/** The box a header sits in, as a screen would hold it. */
const BOX = "overflow-hidden border border-border";

/** A back handler that does nothing: the parts samples only show the button. */
const noop = () => undefined;

/** Navigation header: Arabic. */
export default function Arabic() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div dir="rtl" lang="ar" data-sample="arabic" className={BOX}>
      <UiNavigationHeader
        headingLevel={3}
        title={t(K.arabic_title)}
        onBack={noop}
        backLabel={t(K.arabic_back)}
        endContent={<IconButton icon="bell" label={t(K.arabic_notifications)} variant="ghost" />}
      />
    </div>
  );
}

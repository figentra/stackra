/**
 * Stackra file contract:
 * Purpose: the "custom" demo of the web ErrorPage: a 403 with the app's own words and further actions; the preset keeps its icon and its alert.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); GAPS.md row 31 (owner decision 2026-10-28).
 */
import { Button, ErrorPage, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { ERROR_PAGE_KEYS } from "#src/demos/free/error-page/error-page-keys.constant";

/** The demo's keys. */
const K = ERROR_PAGE_KEYS.error_page;

/** Error page: Your own words. */
export default function Custom() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="border border-separator">
      <ErrorPage
        preset="forbidden"
        headingLevel={3}
        title={t(K.custom.title)}
        description={t(K.custom.description)}
        actions={
          <>
            <Button variant="secondary">{t(K.custom.back_to_orders)}</Button>
            <Button variant="ghost">{t(K.custom.contact_manager)}</Button>
          </>
        }
      />
    </div>
  );
}

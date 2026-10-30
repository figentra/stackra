/**
 * Stackra file contract:
 * Purpose: the "custom" demo of the native ErrorPage: a 403 with the app's own words and further actions; the preset keeps its icon and its alert.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); GAPS.md
 *          row 31 (owner decision 2026-10-28).
 */
import { Button, ErrorPage, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { ERROR_PAGE_DEMO_KEYS } from "#src/demos/free/error-page/error-page-demo-keys.constant";

/** The demo's keys. */
const K = ERROR_PAGE_DEMO_KEYS.demo_free.error_page.custom;

/** The app's own words on a preset. */
export default function Custom() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ErrorPage
      preset="forbidden"
      headingLevel={3}
      title={t(K.title)}
      description={t(K.description)}
      actions={
        <>
          <Button size="sm" variant="secondary">
            {t(K.back_to_orders)}
          </Button>
          <Button size="sm" variant="ghost">
            {t(K.contact_manager)}
          </Button>
        </>
      }
    />
  );
}

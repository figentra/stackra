/**
 * Stackra file contract:
 * Purpose: the "arabic" demo of the web Single column layout: A right-to-left layout: each section reads from the
 *          right.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0317 (decision 7); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 1.4.10 and
 *          4.1.3.
 */
import {
  Section,
  SingleColumnLayout as UiSingleColumnLayout,
  Text,
  useCatalogueText,
} from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SINGLE_COLUMN_LAYOUT_KEYS } from "#src/demos/free/single-column-layout/single-column-layout-keys.constant";

/** The demo's keys. */
const K = SINGLE_COLUMN_LAYOUT_KEYS.single_column_layout;

/** The box a layout sits in, so its edges show. */
// `min-w-0` on every grid item between the page and the layout: a grid item grows to its content's min-content
// otherwise, and the wide sample would widen the page instead of scrolling inside the column.
const BOX = "min-w-0 border border-border p-4";

/** Single column layout: Arabic. */
export default function Arabic() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div dir="rtl" lang="ar" className={BOX} data-sample="arabic">
      <UiSingleColumnLayout>
        <Section headingLevel={3} title={t(K.arabic_customer)}>
          <Text>{t(K.arabic_customer_body)}</Text>
        </Section>
        <Section headingLevel={3} title={t(K.arabic_payment)}>
          <Text>{t(K.arabic_payment_body)}</Text>
        </Section>
      </UiSingleColumnLayout>
    </div>
  );
}

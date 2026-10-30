/**
 * Stackra file contract:
 * Purpose: the "arabic" demo of the web Two column layout: A right-to-left layout: the main column is at the right
 *          and the side column mirrors to the left.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0317 (decisions 1 and 6); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 1.3.2,
 *          1.4.10 and 4.1.3.
 */
import {
  Section,
  Text,
  TwoColumnLayout as UiTwoColumnLayout,
  useCatalogueText,
} from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TWO_COLUMN_LAYOUT_KEYS } from "#src/demos/free/two-column-layout/two-column-layout-keys.constant";

/** The demo's keys. */
const K = TWO_COLUMN_LAYOUT_KEYS.two_column_layout;

/** The box a layout sits in, so its edges show. */
const BOX = "border border-border p-4";

/** Two column layout: Arabic. */
export default function Arabic() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div dir="rtl" lang="ar" className={BOX} data-sample="arabic">
      <UiTwoColumnLayout
        aside={
          <Section headingLevel={3} title={t(K.arabic_aside)}>
            <Text>{t(K.arabic_aside_body)}</Text>
          </Section>
        }
      >
        <Section headingLevel={3} title={t(K.arabic_main)}>
          <Text>{t(K.arabic_main_body)}</Text>
        </Section>
      </UiTwoColumnLayout>
    </div>
  );
}

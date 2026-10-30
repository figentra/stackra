/**
 * Stackra file contract:
 * Purpose: the "arabic" demo of the web Section: A right-to-left section: the title is at the right, the actions at
 *          the left, and the body reads from the right.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0317; ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 2.4.6, 2.5.8 and 4.1.3.
 */
import { Section as UiSection, Text, useCatalogueText } from "@stackra/ui/react";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { SECTION_KEYS } from "#src/demos/free/section/section-keys.constant";

/** The demo's keys. */
const K = SECTION_KEYS.section;

/** Section: Arabic. */
export default function Arabic() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div dir="rtl" lang="ar" data-sample="arabic">
      <UiSection
        headingLevel={3}
        title={t(K.arabic_title)}
        description={t(K.arabic_line)}
        actions={[
          { id: "edit", label: t(K.arabic_edit) },
          { id: "export", label: t(K.arabic_export), icon: Icons.Download },
        ]}
      >
        <Text>{t(K.arabic_body)}</Text>
      </UiSection>
    </div>
  );
}

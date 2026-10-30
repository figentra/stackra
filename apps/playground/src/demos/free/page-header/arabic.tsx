/**
 * Stackra file contract:
 * Purpose: the "arabic" demo of the web Page header: A right-to-left header: the title is at the right, the actions
 *          at the left, and the trail reads from the right.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0317; ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 2.4.6, 2.5.8 and 4.1.3.
 */
import { PageHeader as UiPageHeader, StatusBadge, useCatalogueText } from "@stackra/ui/react";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { PAGE_HEADER_KEYS } from "#src/demos/free/page-header/page-header-keys.constant";

/** The demo's keys. */
const K = PAGE_HEADER_KEYS.page_header;

/** The card a header sits in, as the top of a page would. */
const CARD = "border border-border p-4";

/** Page header: Arabic. */
export default function Arabic() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div dir="rtl" lang="ar" data-sample="arabic" className={CARD}>
      <UiPageHeader
        headingLevel={3}
        title={t(K.arabic_title)}
        description={t(K.arabic_description)}
        status={<StatusBadge tone="success">{t(K.arabic_paid)}</StatusBadge>}
        actions={[
          { id: "edit", label: t(K.arabic_edit) },
          { id: "export", label: t(K.arabic_export), icon: Icons.Download },
        ]}
      />
    </div>
  );
}

/**
 * Stackra file contract:
 * Purpose: the "arabic" demo of the web Pagination: in Arabic the pages run from the right and previous points right.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Pagination, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { PAGINATION_KEYS } from "#src/demos/free/pagination/pagination-keys.constant";

/** The demo's keys. */
const K = PAGINATION_KEYS.pagination.arabic;

/** Pagination: in Arabic the pages run from the right and previous points right. */
export default function Arabic() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div dir="rtl" lang="ar" className="w-full">
      <Pagination total={96} defaultPage={2} pageSizes={[12, 24]} label={t(K.label)} />
    </div>
  );
}

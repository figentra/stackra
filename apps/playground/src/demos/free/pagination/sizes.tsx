/**
 * Stackra file contract:
 * Purpose: the "sizes" demo of the web Pagination: 1,284 orders with a page-size choice and a jump to a page.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Pagination, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { PAGINATION_KEYS } from "#src/demos/free/pagination/pagination-keys.constant";

/** The demo's keys. */
const K = PAGINATION_KEYS.pagination.sizes;

/** Pagination: 1,284 orders with a page-size choice and a jump to a page. */
export default function Sizes() {
  const t = useCatalogueText(MESSAGES.en);
  const [page, setPage] = useState(1);
  return (
    <div className="grid w-full gap-3">
      <Text type="small" tone="muted">
        {t(K.showing, { page })}
      </Text>
      <Pagination
        total={1284}
        page={page}
        onPageChange={setPage}
        pageSizes={[10, 25, 50]}
        hasJump
        label={t(K.label)}
      />
    </div>
  );
}

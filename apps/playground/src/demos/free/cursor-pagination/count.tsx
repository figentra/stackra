/**
 * Stackra file contract:
 * Purpose: the "count" demo of the web Cursor pagination: The count of items shown, never a total. It is a polite
 *          status, so a screen reader hears it change. Its sentence is the caller’s.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0313 (decision 4); ADR 0060 (right-to-left); WCAG 2.2 SC 4.1.3.
 */
import {
  CursorPagination as UiCursorPagination,
  Heading,
  useCatalogueText,
} from "@stackra/ui/react";
import type { ReactNode } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CURSOR_PAGINATION_KEYS } from "#src/demos/free/cursor-pagination/cursor-pagination-keys.constant";

/** The demo's keys. */
const K = CURSOR_PAGINATION_KEYS.cursor_pagination;

/** A captioned sample: a small heading over what it shows. */
function Sample({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <Heading level={3}>{title}</Heading>
      {children}
    </div>
  );
}

/** Cursor pagination: Count. */
export default function Count() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-6">
      <Sample title={t(K.default_count)}>
        <UiCursorPagination label={t(K.default_count)} hasMore hasPrevious count={20} />
      </Sample>
      <Sample title={t(K.custom_count)}>
        <UiCursorPagination
          label={t(K.custom_count)}
          hasMore
          hasPrevious
          count={20}
          countLabel={(count) => t(K.custom_sentence, { count })}
        />
      </Sample>
    </div>
  );
}

/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Pagination: 240 invoices, ten to a page.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Pagination, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { PAGINATION_KEYS } from "#src/demos/free/pagination/pagination-keys.constant";

/** The demo's keys. */
const K = PAGINATION_KEYS.pagination.basics;

/** Pagination: 240 invoices, ten to a page. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return <Pagination total={240} defaultPage={4} label={t(K.label)} className="w-full" />;
}

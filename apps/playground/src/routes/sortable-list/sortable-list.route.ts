/**
 * Stackra file contract:
 * Purpose: the sortable list route of @figentra/playground: its path. The page it renders is
 *          `sortable-list.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5).
 */
import { Route } from "@stackra/navigation";

/** The Sortable list page, at `/sortable-list`. */
export class SortableListRoute extends Route({ path: "/sortable-list" }) {}

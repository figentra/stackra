/**
 * Stackra file contract:
 * Purpose: the bar list route of @figentra/playground: its path. The page it renders is
 *          `bar-list.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5).
 */
import { Route } from "@stackra/navigation";

/** The Bar list page, at `/bar-list`. */
export class BarListRoute extends Route({ path: "/bar-list" }) {}

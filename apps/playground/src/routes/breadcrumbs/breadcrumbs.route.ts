/**
 * Stackra file contract:
 * Purpose: the breadcrumbs route of @figentra/playground: its path. The page it renders is
 *          `breadcrumbs.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5).
 */
import { Route } from "@stackra/navigation";

/** The Breadcrumbs page, at `/breadcrumbs`. */
export class BreadcrumbsRoute extends Route({ path: "/breadcrumbs" }) {}

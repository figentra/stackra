/**
 * Stackra file contract:
 * Purpose: the loading overlay route of @figentra/playground: its path. The page it renders is
 *          `loading-overlay.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5).
 */
import { Route } from "@stackra/navigation";

/** The Loading overlay page, at `/loading-overlay`. */
export class LoadingOverlayRoute extends Route({ path: "/loading-overlay" }) {}

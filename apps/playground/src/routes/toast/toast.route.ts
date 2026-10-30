/**
 * Stackra file contract:
 * Purpose: the toast route of @figentra/playground: its path. The page it renders is
 *          `toast.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5).
 */
import { Route } from "@stackra/navigation";

/** The Toast page, at `/toast`. */
export class ToastRoute extends Route({ path: "/toast" }) {}

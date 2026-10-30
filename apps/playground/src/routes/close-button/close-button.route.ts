/**
 * Stackra file contract:
 * Purpose: the close-button route of @figentra/playground: its path. The page it renders is `close-button.tsx`
 *          beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5).
 */
import { Route } from "@stackra/navigation";

/** The Close button page, at `/close-button`. */
export class CloseButtonRoute extends Route({ path: "/close-button" }) {}

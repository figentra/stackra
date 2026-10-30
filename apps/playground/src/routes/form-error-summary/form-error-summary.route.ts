/**
 * Stackra file contract:
 * Purpose: the form-error-summary route of @figentra/playground: its path. The page it renders is `form-error-summary.tsx` beside it (ADR 0294
 *          decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5); STA-1371.
 */
import { Route } from "@stackra/navigation";

/** The Form error summary page, at `/form-error-summary`. */
export class FormErrorSummaryRoute extends Route({ path: "/form-error-summary" }) {}

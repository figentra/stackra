/**
 * Stackra file contract:
 * Purpose: the Tamo draft review route of @figentra/playground: its path. The page it renders is `tamo-draft-review.tsx` beside it (ADR 0294
 *          decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5); ADR 0507 (Ask Tamo: AI slots in the design system).
 */
import { Route } from "@stackra/navigation";

/** The Tamo draft review page, at `/tamo-draft-review`. */
export class TamoDraftReviewRoute extends Route({ path: "/tamo-draft-review" }) {}

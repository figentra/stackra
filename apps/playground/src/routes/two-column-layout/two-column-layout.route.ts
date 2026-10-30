/**
 * Stackra file contract:
 * Purpose: the two-column-layout route of @figentra/playground: its path. The page it renders is
 *          `two-column-layout.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5).
 */
import { Route } from "@stackra/navigation";

/** The TwoColumnLayout page, at `/two-column-layout`. */
export class TwoColumnLayoutRoute extends Route({ path: "/two-column-layout" }) {}

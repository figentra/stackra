/**
 * Stackra file contract:
 * Purpose: the Tamo ghost text route of @figentra/playground: its path. The page it renders is `tamo-ghost-text.tsx` beside it (ADR 0294
 *          decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5); ADR 0507 (Ask Tamo: AI slots in the design system).
 */
import { Route } from "@stackra/navigation";

/** The Tamo ghost text page, at `/tamo-ghost-text`. */
export class TamoGhostTextRoute extends Route({ path: "/tamo-ghost-text" }) {}

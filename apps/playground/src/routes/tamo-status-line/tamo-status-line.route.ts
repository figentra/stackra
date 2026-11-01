/**
 * Stackra file contract:
 * Purpose: the Tamo status route of @figentra/playground: its path. The page it renders is `tamo-status-line.tsx` beside it (ADR 0294
 *          decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5); ADR 0507 (Ask Tamo: AI slots in the design system).
 */
import { Route } from "@stackra/navigation";

/** The Tamo status page, at `/tamo-status-line`. */
export class TamoStatusLineRoute extends Route({ path: "/tamo-status-line" }) {}

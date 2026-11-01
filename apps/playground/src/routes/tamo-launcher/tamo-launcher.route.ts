/**
 * Stackra file contract:
 * Purpose: the Tamo launcher route of @figentra/playground: its path. The page it renders is `tamo-launcher.tsx` beside it (ADR 0294
 *          decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5); ADR 0507 (Ask Tamo: AI slots in the design system).
 */
import { Route } from "@stackra/navigation";

/** The Tamo launcher page, at `/tamo-launcher`. */
export class TamoLauncherRoute extends Route({ path: "/tamo-launcher" }) {}

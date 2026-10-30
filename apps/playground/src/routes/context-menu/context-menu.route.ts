/**
 * Stackra file contract:
 * Purpose: the context-menu route of @figentra/playground: its path. The page it renders is `context-menu.tsx` beside it (ADR 0294
 *          decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5).
 */
import { Route } from "@stackra/navigation";

/** The Context menu page, at `/context-menu`. */
export class ContextMenuRoute extends Route({ path: "/context-menu" }) {}

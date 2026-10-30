/**
 * Stackra file contract:
 * Purpose: the number pad route of @figentra/playground: its path. The page it renders is
 *          `number-pad.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5).
 */
import { Route } from "@stackra/navigation";

/** The Number pad page, at `/number-pad`. */
export class NumberPadRoute extends Route({ path: "/number-pad" }) {}

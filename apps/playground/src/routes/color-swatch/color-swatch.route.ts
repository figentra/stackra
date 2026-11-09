/**
 * Stackra file contract:
 * Purpose: the colour swatch route of @figentra/playground: its path. The page it renders is
 *          `color-swatch.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5); STA-1981.
 */
import { Route } from "@stackra/navigation";

/** The ColorSwatch page, at `/color-swatch`. */
export class ColorSwatchRoute extends Route({ path: "/color-swatch" }) {}

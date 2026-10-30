/**
 * Stackra file contract:
 * Purpose: the widget-frame route of @figentra/playground: its path. The page it renders is `widget-frame.tsx` beside it (ADR 0294
 *          decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5).
 */
import { Route } from "@stackra/navigation";

/** The Widget frame page, at `/widget-frame`. */
export class WidgetFrameRoute extends Route({ path: "/widget-frame" }) {}

/**
 * Stackra file contract:
 * Purpose: the button link route of @figentra/playground: its path. The page it renders is
 *          `button-link.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5); STA-2041.
 */
import { Route } from "@stackra/navigation";

/** The ButtonLink page, at `/button-link`. */
export class ButtonLinkRoute extends Route({ path: "/button-link" }) {}

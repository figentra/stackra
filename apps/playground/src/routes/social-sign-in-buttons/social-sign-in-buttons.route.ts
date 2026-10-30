/**
 * Stackra file contract:
 * Purpose: the social sign-in buttons route of @figentra/playground: its path. The page it renders is
 *          `social-sign-in-buttons.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5).
 */
import { Route } from "@stackra/navigation";

/** The Social sign-in buttons page, at `/social-sign-in-buttons`. */
export class SocialSignInButtonsRoute extends Route({ path: "/social-sign-in-buttons" }) {}

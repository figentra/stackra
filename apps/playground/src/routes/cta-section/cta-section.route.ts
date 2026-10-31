/**
 * Stackra file contract:
 * Purpose: the call to action route of @figentra/playground: its path. The page it renders is
 *          `cta-section.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5); ADR 0504 (module UI kits).
 */
import { Route } from "@stackra/navigation";

/** The CtaSection page, at `/cta-section`. */
export class CtaSectionRoute extends Route({ path: "/cta-section" }) {}

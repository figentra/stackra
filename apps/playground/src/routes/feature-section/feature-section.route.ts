/**
 * Stackra file contract:
 * Purpose: the feature section route of @figentra/playground: its path. The page it renders is
 *          `feature-section.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5); ADR 0503 (module UI kits).
 */
import { Route } from "@stackra/navigation";

/** The FeatureSection page, at `/feature-section`. */
export class FeatureSectionRoute extends Route({ path: "/feature-section" }) {}

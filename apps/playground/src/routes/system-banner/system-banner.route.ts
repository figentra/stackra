/**
 * Stackra file contract:
 * Purpose: the system banner route of @figentra/playground: its path. The page it renders is
 *          `system-banner.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5).
 */
import { Route } from "@stackra/navigation";

/** The System banner page, at `/system-banner`. */
export class SystemBannerRoute extends Route({ path: "/system-banner" }) {}
